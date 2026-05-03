# **AI SYSTEM PROMPT: TRUCK & TRAILER MAINTENANCE MANAGEMENT SYSTEM (APPSHEET)**

**Instructions for AI Agent:** Act as an Expert AppSheet Developer and System Architect. Generate the Google Sheets schema, AppSheet configurations, column formulas, and Automation Bots based on this document. **CRITICAL: Ensure you have read and applied the separate "AI System Rules" document before generating any output.**

\<system\_context\>

* **Platform:** AppSheet (Frontend/Logic) \+ Google Sheets (Database).  
* **Domain:** Fleet Maintenance Management (Truck & Trailer).  
* **Architecture:** 4-Module Enterprise Architecture (Master Data, Asset & HR, Workflow, Inventory & Finance).  
  \</system\_context\>

\<database\_schema\_and\_types\>

## **MODULE 1: MASTER DATA**

**Table:** DANH\_MUC\_GARA

* ID\_Gara (Text, Key, InitialValue: UNIQUEID())  
* Ten\_Gara (Text, Required)  
* Dia\_Chi (Address)  
* Toa\_Do\_Gara (LatLong)  
* Loai\_Gara (Enum: \["Nội bộ", "Hợp tác đối tác"\])

**Table:** DANH\_MUC\_VAT\_TU\_SKU

* ID\_SKU (Text, Key, InitialValue: UNIQUEID())  
* Ten\_Vat\_Tu (Text, Required)  
* Nhom\_Vat\_Tu (Enum: \["Động cơ", "Gầm", "Điện", "Lốp", "Máy lạnh"\])  
* Don\_Vi\_Tinh (Enum: \["Cái", "Bộ", "Can", "Lít", "Gói"\])

## **MODULE 2: ASSET & HR**

**Table:** DANH\_SACH\_XE

* ID\_Xe (Text, Key)  
* Bien\_So (Text, Label, Required)  
* Loai\_Xe (Enum: \["Đầu kéo", "Rơ-moóc", "Xe tải"\])  
* So\_KM\_Hien\_Tai (Number, Source: GPS API)  
* So\_Gio\_May (Number, Source: GPS API)  
* Toa\_Do\_Xe\_GPS (LatLong, Source: GPS API)  
* QR\_Code (Image)

**Table:** QUAN\_LY\_VO\_XE

* ID\_Vo (Text, Key, Note: This is the physical Serial Number)  
* ID\_Xe (Ref \-\> DANH\_SACH\_XE)  
* Vi\_Tri\_Lap (Enum: \["Vỏ 1", "Vỏ 2", "Vỏ 3", ..., "Vỏ 22"\])  
* Tinh\_Trang\_Gai (Number, unit: mm)  
* Trang\_Thai\_Vo (Enum: \["Đang chạy", "Chờ đắp", "Thanh lý"\])  
* *Constraint (Valid\_If for ID\_Vo):* ISBLANK(FILTER("QUAN\_LY\_VO\_XE", \[ID\_Vo\] \= \[\_THIS\]))

## **MODULE 3: MAINTENANCE WORKFLOW**

**Table:** PHIEU\_BAO\_TRI

* ID\_Phieu (Text, Key, InitialValue: UNIQUEID())  
* ID\_Xe (Ref \-\> DANH\_SACH\_XE)  
* Nguoi\_Tao (Email, InitialValue: USEREMAIL(), ReadOnly: True)  
* Toa\_Do\_App (LatLong, InitialValue: HERE())  
* Canh\_Bao\_GPS (Yes/No, AppFormula: IF(DISTANCE(\[Toa\_Do\_App\], \[ID\_Xe\].\[Toa\_Do\_Xe\_GPS\]) \> 1, TRUE, FALSE))  
* Trang\_Thai\_Phieu (Enum: \["Báo giá", "Chờ duyệt", "Đang sửa", "Đã xong"\])  
* Tong\_Vat\_Tu (Price, AppFormula: SUM(\[Related CHI\_TIET\_VAT\_TUs\]\[Thanh\_Tien\]))  
* Tien\_Cong (Price)  
* Tong\_Chi\_Phi (Price, AppFormula: \[Tong\_Vat\_Tu\] \+ \[Tien\_Cong\])  
* Last\_Updated (DateTime, InitialValue: NOW())

**Table:** CHI\_TIET\_VAT\_TU\_SU\_DUNG (Child table of PHIEU\_BAO\_TRI)

* ID\_Chi\_Tiet (Text, Key, InitialValue: UNIQUEID())  
* ID\_Phieu (Ref \-\> PHIEU\_BAO\_TRI, IsPartOf: True)  
* ID\_SKU (Ref \-\> DANH\_MUC\_VAT\_TU\_SKU)  
* So\_Luong (Number)  
* Don\_Gia (Price)  
* Thanh\_Tien (Price, AppFormula: \[So\_Luong\] \* \[Don\_Gia\])  
* Anh\_Vat\_Tu\_Cu (Image, Required: True)  
* Anh\_Vat\_Tu\_Moi (Image, Required: True)  
  \</database\_schema\_and\_types\>

\<security\_and\_rbac\>

* **Role 1: Thợ máy / Tài xế (Mechanic/Driver)**  
  * Table PHIEU\_BAO\_TRI: Access Mode \= ADDS\_ONLY.  
  * Security Filter (PHIEU\_BAO\_TRI): \[Nguoi\_Tao\] \= USEREMAIL()  
* **Role 2: Quản lý kỹ thuật (Technical Manager)**  
  * Table PHIEU\_BAO\_TRI: Access Mode \= ALL\_CHANGES.  
  * Allowed to edit Trang\_Thai\_Phieu to "Chờ duyệt" or "Đã xong".  
    \</security\_and\_rbac\>

\<appsheet\_actions\>

* **Action:** Duyệt Báo Giá  
  * For Record of Table: PHIEU\_BAO\_TRI  
  * Do this: Set the values of some columns in this row  
  * Set Trang\_Thai\_Phieu \= "Đang sửa"  
  * Only if this condition is true: AND(\[Trang\_Thai\_Phieu\] \= "Chờ duyệt", USERROLE() \= "Admin")  
* **Action:** Đảo Vỏ  
  * For Record of Table: QUAN\_LY\_VO\_XE  
  * Do this: Set the values of some columns in this row  
  * Set Vi\_Tri\_Lap \= Prompts user for input (INPUT("Vi\_Tri\_Lap", ""))  
    \</appsheet\_actions\>

\<automation\_bots\>

* **Bot:** Duyệt\_Chi\_Phi\_Lon  
  * **Event:** Adds and Updates in PHIEU\_BAO\_TRI  
  * **Condition:** AND(\[Trang\_Thai\_Phieu\] \= "Báo giá", \[Tong\_Chi\_Phi\] \>= 5000000\)  
  * **Action/Task:** Send Push Notification to Technical Manager (Admin).  
  * **Message:** "Phiếu bảo trì " & \[ID\_Phieu\] & " cho xe " & \[ID\_Xe\].\[Bien\_So\] & " đang chờ duyệt. Tổng chi phí: " & \[Tong\_Chi\_Phi\]  
* **Bot:** Reset\_Trang\_Thai\_Khi\_Thay\_Doi\_Gia  
  * **Event:** Updates only in PHIEU\_BAO\_TRI  
  * **Condition:** AND(\[Trang\_Thai\_Phieu\] \<\> "Báo giá", \[\_THISROW\_BEFORE\].\[Tong\_Chi\_Phi\] \<\> \[\_THISROW\_AFTER\].\[Tong\_Chi\_Phi\])  
  * **Action:** Execute Data Action \-\> Set Trang\_Thai\_Phieu \= "Báo giá"  
    \</automation\_bots\>

\<ux\_settings\>

* Enable "Store content for offline use".  
* Enable "Delay sync".  
* Set Image Upload Resolution to "Low".  
  \</ux\_settings\>
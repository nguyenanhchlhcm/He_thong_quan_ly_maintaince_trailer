# **T2M-APP: BẢN KIẾN TRÚC TỔNG THỂ & DỮ LIỆU DANH MỤC (COMPREHENSIVE SKELETON)**

**Dự án:** T2M-App (Truck & Trailer Maintenance)

**Mục tiêu tài liệu:** Cung cấp toàn bộ bối cảnh kiến trúc, cấu trúc cơ sở dữ liệu và tiêu chuẩn UI/UX để Lập trình viên/AI thiết kế giao diện và phát triển tính năng chính xác.

## **1\. NGUYÊN TẮC THIẾT KẾ CỐT LÕI (CORE PRINCIPLES)**

1. **Tách biệt Logic và UI:** Component UI chỉ nhận Props và hiển thị. Logic lấy dữ liệu (Fetch/Sync) nằm ở Custom Hooks. Logic trạng thái nằm ở Zustand.  
2. **Feature-Driven Structure:** Phân chia thư mục theo Nghiệp vụ (Features) để dễ bảo trì.  
3. **Single Source of Truth:** Dữ liệu chuẩn nằm ở Supabase. Khi mất mạng, IndexedDB là nguồn tạm thời. React Query đồng bộ 2 nguồn này.  
4. **Lấy Người Dùng Làm Trung Tâm (Non-Tech Friendly \- Poka-yoke):** Giao diện Thợ máy ưu tiên "chống thao tác sai". Nút bấm lớn, luồng thao tác ngắn. Mọi thông báo lỗi phải dùng tiếng Việt bình dân (VD: *"Mạng yếu, anh thử lại nhé"* thay vì *"Network Error 500"*).  
5. **Định hướng Màu sắc UI (Logo Identity):** Sử dụng các sắc thái **Xanh dương đậm (Navy Blue)** từ logo mỏ neo làm màu chủ đạo (Primary) cho sự chuyên nghiệp, đáng tin cậy. Kết hợp màu **Trắng/Xám nhạt** cho background để tạo độ tương phản, sạch sẽ và hiện đại.

## **2\. CẤU TRÚC THƯ MỤC CHUẨN (FOLDER DIRECTORY)**

t2m-webapp/  
├── src/  
│   ├── app/                    \# ROUTING (Các trang: /login, /mechanic, /manager)  
│   ├── components/             \# SHARED UI (Button, Input, Form, Layouts)  
│   ├── features/               \# NGHIỆP VỤ CỐT LÕI  
│   │   ├── master-data/        \# Quản lý danh mục (Xe, Phụ tùng, Nhân sự...)  
│   │   ├── maintenance/        \# Phiếu bảo trì (Quy trình thợ máy)  
│   │   ├── inventory/          \# Quản lý Kho & Đặt hàng  
│   │   └── analytics/          \# Dashboard BI phân tích chi phí  
│   ├── hooks/                  \# GLOBAL HOOKS (useGPS, useOfflineSync)  
│   ├── lib/                    \# UTILITIES (Supabase, Haversine, ImageCompress)  
│   ├── store/                  \# GLOBAL STATE (Zustand)  
│   └── types/                  \# TYPESCRIPT INTERFACES

## **3\. CẤU TRÚC DỮ LIỆU NỀN TẢNG (MASTER DATA STRUCTURE)**

*Yêu cầu AI/Dev tạo giao diện CRUD cho các danh mục này trên trang Admin/Manager.*

**3.1. Danh mục Xe & Rơ moóc (Vehicle & Trailer Catalog)**

* Tách biệt Đầu kéo và Rơ moóc.  
* **Trường dữ liệu:** Biển số xe (Unique), Loại (Đầu kéo/Rơ moóc), Thương hiệu, Số khung/Số máy, Năm SX, Số KM hiện tại, Trạng thái (Đang chạy/Nằm bãi/Sửa chữa).

**3.2. Danh mục Vật tư & Phụ tùng (Parts & Inventory Catalog)**

* **Trường dữ liệu:** Mã phụ tùng (SKU), Tên phụ tùng, Nhóm vật tư (Dầu nhớt/Gầm/Lốp/Điện), Đơn vị tính, Giá nhập tham khảo, Định mức thay thế (VD: 20,000km), Tồn kho tối thiểu.

**3.3. Danh mục Dịch vụ / Tiền công (Service & Labor Catalog)**

* **Trường dữ liệu:** Mã dịch vụ, Tên dịch vụ (VD: Công thay lá côn), Đơn giá chuẩn (0đ cho xe nhà, giá VNĐ cho khách ngoài), Thời gian SLA dự kiến.

**3.4. Danh mục Khách hàng (Customer Catalog \- Phục vụ sửa xe ngoài)**

* **Trường dữ liệu:** Mã KH, Tên công ty/Cá nhân, SĐT/Zalo (Để gửi thông báo), MST, Hạng khách, Công nợ.

**3.5. Danh mục Nhà cung cấp (Supplier Catalog)**

* **Trường dữ liệu:** Mã NCC, Tên NCC, Nhóm cung cấp chính, Liên hệ, Điểm đánh giá (Rating sao).

**3.6. Danh mục Nhân sự & Thợ máy (Employee/Mechanic Catalog)**

* **Trường dữ liệu:** Mã NV, Tên NV, Chức vụ (Thợ máy/Thợ điện/Quản đốc...), Gara trực thuộc, Trạng thái làm việc (Không được xóa NV đã nghỉ để giữ lịch sử).

**3.7. Danh mục Gara / Kho bãi (Location/Garage Catalog)**

* **Trường dữ liệu:** Mã Gara, Tên Gara, **Tọa độ GPS chuẩn (Lat/Lng)** (Dùng làm mốc check GPS).

## **4\. CƠ SỞ DỮ LIỆU NGHIỆP VỤ & TRIGGER (TRANSACTIONS)**

**4.1. Bảng Nghiệp Vụ:**

* MAINTENANCE\_TICKETS: id, id\_xe, id\_tho\_may, so\_km\_luc\_sua, toa\_do\_lat, toa\_do\_lng, canh\_bao\_gps, tong\_tien, trang\_thai.  
* TICKET\_DETAILS: id, id\_phieu, id\_vat\_tu, so\_luong, don\_gia, **anh\_cu\_url \[NOT NULL\]**, **anh\_moi\_url \[NOT NULL\]**.  
* PREVENTIVE\_LOGS: Lịch sử bảo dưỡng định kỳ.

**4.2. Cơ chế Trigger (Bảo mật Data \- Bắt buộc):**

* **Cost Integrity:** Cập nhật tong\_tien ở phiếu khi TICKET\_DETAILS thay đổi (Không tính tiền ở Frontend).  
* **Approval Integrity:** Lùi trạng thái về "Báo giá" nếu bill thay đổi.  
* **Odometer Update:** Tự động cộng số KM mới vào bảng VEHICLES khi phiếu hoàn tất.

## **5\. BỘ ĐỘNG CƠ CỐT LÕI CẦN XÂY TRƯỚC (CORE ENGINES)**

**Engine 1: Offline-First & Concurrency Control**

* Sử dụng localforage. Mọi phiếu sửa được lưu nháp tại Local khi mất mạng.  
* **Anti-Conflict:** Khi có mạng, trước khi Sync, kiểm tra xem phiếu xe này có bị thợ khác ghi đè không.

**Engine 2: Anti-Fraud Location (Định vị GPS)**

* Tính khoảng cách Haversine giữa tọa độ app lúc mở phiếu và tọa độ Gara. Lệch \> 1km \-\> Bật cờ canh\_bao\_gps.  
* **Fallback UI:** Nếu sóng yếu (sai số \> 1000m) hoặc user từ chối quyền, UI phải hướng dẫn thợ ra chỗ thoáng hoặc mở lại quyền.

**Engine 3: Strict Image Processing (Hình ảnh)**

* **Bắt buộc dùng Camera trực tiếp:** UI Input file phải có thuộc tính capture="environment" (Chặn tải ảnh cũ từ thư viện).  
* Nén ảnh bằng browser-image-compression (\<100KB, 800x800px, WebP) tại Client trước khi upload lên Supabase.  
* Chạy Script định kỳ dọn dẹp ảnh phiếu đã nghiệm thu \> 60 ngày để tiết kiệm Free Tier Storage.

**Engine 4: Poka-Yoke Odometer Validation (Chống nhập sai KM)**

* Bắt buộc ô nhập KM của thợ dùng bàn phím số to.  
* **Chặn lỗi cứng:** Số KM nhập vào KHÔNG ĐƯỢC nhỏ hơn KM hiện tại, và KHÔNG ĐƯỢC lớn hơn (KM cũ \+ 10,000km). Quá biên độ này sẽ chặn submit và báo lỗi.
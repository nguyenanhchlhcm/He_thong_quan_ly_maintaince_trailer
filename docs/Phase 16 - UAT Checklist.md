# **📋 T2M-APP: USER ACCEPTANCE TESTING (UAT) CHECKLIST**

Tài liệu này hướng dẫn quy trình kiểm thử thực tế (Phase 16) cho dự án T2M-App.

---

## **1. QUY TRÌNH CHUẨN BỊ (PRE-REQUISITES)**
- [ ] Ứng dụng đã được deploy thành công lên Vercel Production.
- [ ] Database Supabase đã có Seed Data (Xe, Vật tư, Gara).
- [ ] Tài khoản test cho 2 Role: **Thợ máy (Mechanic)** và **Quản lý (Manager)**.
- [ ] Thiết bị di động (Smartphone/Tablet) để test hiện trường.

---

## **2. KỊCH BẢN KIỂM THỬ (TEST SCENARIOS)**

### **A. Role: Thợ máy (Mechanic) - Luồng Sửa chữa**
| STT | Tính năng | Hành động mong đợi | Kết quả (Pass/Fail) | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Đăng nhập | Đăng nhập bằng tài khoản Mechanic và vào đúng Dashboard mobile. | | |
| 2 | Tạo phiếu mới | Nhấn "Tạo phiếu", chọn đúng Biển số xe và Gara hiện tại. | | |
| 3 | Kiểm tra GPS | GPS xác định đúng vị trí Gara (không hiện cảnh báo đỏ). | | |
| 4 | Thêm vật tư | Thêm 1 loại nhớt, nhập số lượng và đơn giá. | | |
| 5 | Chụp ảnh (Rule 1) | Bắt buộc chụp ảnh vật tư CŨ và MỚI (không chụp không cho lưu). | | |
| 6 | Offline Mode | Tắt mạng, lưu phiếu. Phiếu phải được lưu vào hàng đợi (Sync Queue). | | |
| 7 | Đồng bộ | Bật mạng lại, phiếu tự động đẩy lên Supabase và mất trạng thái "Offline". | | |

### **B. Role: Quản lý (Manager) - Luồng Phê duyệt**
| STT | Tính năng | Hành động mong đợi | Kết quả (Pass/Fail) | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Xem danh sách | Dashboard hiển thị danh sách phiếu "Chờ duyệt" từ thợ máy. | | |
| 2 | Kiểm tra Fraud | Xem ảnh CŨ/MỚI và kiểm tra Cảnh báo GPS (nếu có). | | |
| 3 | Phê duyệt | Nhấn "Phê duyệt", trạng thái phiếu đổi sang "Đang sửa". | | |
| 4 | Nghiệm thu | Khi thợ xong, nhấn "Nghiệm thu", tổng chi phí cập nhật vào DB. | | |

### **C. Module Lốp xe (Asset Intelligence)**
| STT | Tính năng | Hành động mong đợi | Kết quả (Pass/Fail) | Ghi chú |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Truy xuất Serial | Nhập Serial lốp, xem được lịch sử xe nào đã lắp lốp này. | | |
| 2 | Đảo lốp | Chuyển lốp từ "Trước trái" sang "Dự phòng", DB cập nhật vị trí. | | |

---

## **3. BÁO CÁO LỖI (BUG REPORT TEMPLATE)**
Khi phát hiện lỗi, thợ máy/quản lý cần ghi nhận theo form:
1. **Mô tả lỗi:** (Ví dụ: Không nhấn được nút Chụp ảnh trên iPhone)
2. **Các bước tái hiện:** (Bước 1 -> Bước 2 -> ...)
3. **Mức độ:** (Nghiêm trọng / Trung bình / Nhẹ)
4. **Ảnh chụp màn hình:** (Nếu có)

---

## **4. KẾ HOẠCH FIX LỖI (PATCHING PLAN)**
- **Hotfix:** Các lỗi chặn luồng (Crash, không lưu được dữ liệu) - Fix trong 24h.
- **UI/UX Patch:** Các lỗi hiển thị, font chữ, màu sắc - Gom lại fix cuối Phase 16.

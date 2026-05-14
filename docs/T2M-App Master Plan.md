# **🚛 T2M-APP MASTER PLAN: LỘ TRÌNH TRIỂN KHAI DỰ ÁN**

Tài liệu này chia nhỏ quá trình xây dựng T2M-App thành 17 Phase (Giai đoạn) theo chuẩn Agile. Các Phase được sắp xếp theo thứ tự ưu tiên từ hạ tầng cốt lõi đến tính năng bề mặt, đảm bảo tuân thủ nghiêm ngặt 7 Quy tắc Bất biến (System Rules).

## **PHẦN I: HẠ TẦNG CỐT LÕI & DATABASE (CORE BACKEND)**

### **Phase 1: Thiết lập Kiến trúc & Hạ tầng (Project Setup)**

* **Mục tiêu:** Khởi tạo môi trường làm việc chuẩn cho toàn team.  
* **Công việc:** \* Khởi tạo Next.js 14 (App Router), cài đặt Tailwind CSS, Shadcn UI.  
  * Thiết lập cấu trúc thư mục chuẩn (features, hooks, lib, store).  
  * Khởi tạo Project Supabase, kết nối biến môi trường (.env).  
* **Đầu ra (DoD):** Source code base có thể chạy npm run dev không lỗi, deploy thử nghiệm thành công lên Vercel.

* **Mục tiêu:** Xây dựng khung xương lưu trữ dữ liệu.  
* **Công việc:** \* Tạo các bảng trên Supabase PostgreSQL (Xe, Gara, Vật tư, Phiếu bảo trì, Lốp xe...).  
  * Viết policies Row Level Security (RLS) cho 3 Roles: ADMIN, MANAGER, MECHANIC.  
* **Đầu ra (DoD):** [DONE] Database schema hoàn chỉnh, test RLS đảm bảo Mechanic không thể xem phiếu của người khác.

### **Phase 3: Lập trình Database Triggers (Bảo vệ Toàn vẹn Dữ liệu)** [DONE]

* **Mục tiêu:** Thực thi Rule 3 (Cost Integrity) và Rule 4 (Approval Workflow).  
* **Công việc:** \* Viết Trigger Auto\_Calculate\_Totals tính tổng tiền dựa trên Chi tiết vật tư.  
  * Viết Trigger Reset\_Status\_On\_Cost\_Change tự động lùi trạng thái về "Báo giá" nếu bill thay đổi.  
* **Đầu ra (DoD):** [DONE] Sửa data trực tiếp trong DB cũng tự động tính lại tổng tiền, chặn triệt để việc submit giá giả từ Frontend.

## **PHẦN II: XÁC THỰC & QUẢN LÝ DANH MỤC (ADMIN & MASTER DATA)**

### **Phase 4: Hệ thống Xác thực & Phân quyền (Auth)**

* **Mục tiêu:** Quản lý đăng nhập và phiên làm việc.  
* **Công việc:** \* Tích hợp Supabase Auth (Email/Password).  
  * Xây dựng middleware trong Next.js để bảo vệ các routes dựa trên Role.  
* **Đầu ra (DoD):** Người dùng đăng nhập thành công và bị điều hướng về đúng Dashboard tương ứng (Thợ máy vs Quản lý).

### **Phase 5: Module Quản lý Danh mục (Master Data)** [DONE]

* **Mục tiêu:** Xây dựng công cụ cho ADMIN nhập liệu ban đầu.  
* **Công việc:** \* Giao diện CRUD (Thêm/Sửa/Xóa) cho: Danh sách Xe, Danh mục Vật tư/Phụ tùng, Danh sách Gara, Danh sách Nhân viên.  
* **Đầu ra (DoD):** [DONE] Có sẵn data mẫu (Seed data) để các module sau hoạt động. Thêm bảng Khách hàng, NCC, Dịch vụ.

## **PHẦN III: GIAO DIỆN & NGHIỆP VỤ THỢ MÁY (MECHANIC WORKFLOW)**

### **Phase 6: Thiết kế UI/UX Thợ máy (Mobile-First)** [DONE - PREMIUM UPGRADE]

* **Mục tiêu:** Tối ưu hóa thao tác trên màn hình điện thoại, phù hợp với môi trường Gara.  
* **Công việc:** \* Xây dựng Layout tối giản, nút bấm to, form nhập liệu dễ nhìn ngoài trời sáng.  
* **Đầu ra (DoD):** [DONE] UI responsive 100% trên thiết bị di động, điểm Lighthouse (Mobile) \> 90\. Theme Navy Blue & Glassmorphism.

### **Phase 7: Nghiệp vụ Phiếu Bảo Trì (Core CRUD)**

* **Mục tiêu:** Cho phép thợ máy tạo và cập nhật phiếu sửa chữa.  
* **Công việc:** \* Xây dựng form tạo PHIEU\_BAO\_TRI.  
  * Giao diện thêm/bớt CHI\_TIET\_VAT\_TU\_SU\_DUNG vào phiếu.  
* **Đầu ra (DoD):** Thợ máy tạo thành công phiếu, DB lưu đúng thông tin.

### **Phase 8: Nén ảnh Client-side & Upload (Anti-Fraud 1\)** [DONE]

* **Mục tiêu:** Thực thi Rule 1 (Visual Proof) & Rule 7 (Data Bloat).  
* **Công việc:** \* Tích hợp browser-image-compression, nén ảnh \< 800x800px chuẩn WebP.  
  * Bắt buộc upload 2 ảnh (CŨ/MỚI) trước khi submit vật tư lên Supabase Storage.  
* **Đầu ra (DoD):** [DONE] Upload ảnh nhanh, dung lượng mỗi ảnh \< 100KB, form báo lỗi nếu thiếu ảnh.

### **Phase 9: Định vị GPS & Cảnh báo (Anti-Fraud 2\)** [DONE]

* **Mục tiêu:** Thực thi Rule 2 (GPS Verification).  
* **Công việc:** \* Lấy tọa độ từ HTML5 Geolocation API khi ấn "Bắt đầu sửa chữa".  
  * Tính toán công thức Haversine tại client/server.  
  * Bật cờ canh\_bao\_gps nếu lệch \> 1km.  
* **Đầu ra (DoD):** [DONE] Chặn các trường hợp mang phụ tùng ra ngoài Gara để báo cáo ảo. Hiển thị khoảng cách thực tế.

## **PHẦN IV: OFFLINE-FIRST & ĐỒNG BỘ DỮ LIỆU (RESILIENCE)**

### **Phase 10: Tích hợp IndexedDB (Offline Storage)**

* **Mục tiêu:** Thực thi Rule 6 (Offline-first).  
* **Công việc:** \* Tích hợp localforage hoặc Zustand persist.  
  * Mọi thay đổi trên form Phiếu bảo trì được lưu ngay vào cache trình duyệt.  
* **Đầu ra (DoD):** Tắt WiFi, reload trang web, dữ liệu đang nhập dở vẫn còn nguyên.

### **Phase 11: Luồng Đồng bộ (Sync Engine & Conflict Resolution)**

* **Mục tiêu:** Đẩy dữ liệu an toàn lên Cloud khi có mạng.  
* **Công việc:** \* Viết worker/hook lắng nghe sự kiện navigator.onLine.  
  * Tự động push dữ liệu từ IndexedDB lên Supabase. Xử lý UI báo trạng thái (Đang đồng bộ/Đã lưu).  
* **Đầu ra (DoD):** Dữ liệu không bị mất khi chuyển từ vùng mất sóng sang vùng có sóng.

## **PHẦN V: QUẢN LÝ TÀI SẢN & QUY TRÌNH PHÊ DUYỆT (MANAGER WORKFLOW)**

### **Phase 12: Luồng Phê duyệt của Quản lý (Manager Dashboard)**

* **Mục tiêu:** Công cụ kiểm soát chi phí cho Manager.  
* **Công việc:** \* Giao diện danh sách phiếu chờ duyệt, xem hình ảnh vật tư CŨ/MỚI.  
  * Các nút action: "Duyệt giá", "Từ chối", "Hoàn thành".  
* **Đầu ra (DoD):** Manager có thể duyệt hoặc bác bỏ phiếu sửa chữa theo thời gian thực.

### **Phase 13: Quản lý Vòng đời Lốp Xe (Asset Intelligence)**

* **Mục tiêu:** Thực thi Rule 5 (Tire Strictness).  
* **Công việc:** \* Module theo dõi Serial Number lốp.  
  * Logic chuyển đổi vị trí lắp lốp (Đảo lốp, thay lốp) chỉ dùng lệnh UPDATE.  
* **Đầu ra (DoD):** Ngăn chặn 100% việc nhập trùng Serial lốp, truy xuất được lịch sử của 1 chiếc lốp từ lúc mua đến lúc hỏng.

## **PHẦN VI: BÁO CÁO, CẢNH BÁO & TỐI ƯU HÓA (BI & OPTIMIZATION)**

### **Phase 14: Hệ thống Báo cáo Kế toán & Phân tích (Analytics)**

* **Mục tiêu:** Trực quan hóa dữ liệu chi phí.  
* **Công việc:** \* Tính toán chỉ số CP/KM (Chi phí bảo trì / Tổng KM xe chạy).  
  * Biểu đồ chi phí theo đầu xe, theo Gara. Xuất dữ liệu Excel.  
* **Đầu ra (DoD):** Dashboard cung cấp cái nhìn toàn cảnh về tình trạng hao tài sản.

### **Phase 15: Cảnh báo Tự động (Automated Alerts)**

* **Mục tiêu:** Bảo trì chủ động.  
* **Công việc:** \* Cảnh báo xe đến hạn thay nhớt, bảo dưỡng dựa trên KM hoặc thời gian.  
  * Cảnh báo các phiếu có cờ gian lận (GPS sai).  
* **Đầu ra (DoD):** UI hiển thị các notification đỏ cho Manager xử lý.

## **PHẦN VII: TESTING & TRIỂN KHAI (DEPLOYMENT)**

### **Phase 16: UAT & Triển khai Pilot (Vercel)**

* **Mục tiêu:** Kiểm thử thực tế.  
* **Công việc:** \* Cấu hình Vercel Production.  
  * User Acceptance Testing (UAT) với 1 thợ máy và 1 quản lý thực tế tại Gara thử nghiệm.  
* **Đầu ra (DoD):** Báo cáo bug thực tế và bản vá lỗi.

### **Phase 17: Tối ưu hiệu năng, Đào tạo & Bàn giao**

* **Mục tiêu:** Đưa hệ thống vào vận hành chính thức.  
* **Công việc:** \* Tối ưu hóa caching (React Query).  
  * Biên soạn sổ tay sử dụng (User Manual) cho Thợ máy.  
  * Giám sát hạn mức tài nguyên (Free Tier Storage/Database) của Supabase.  
* **Đầu ra (DoD):** Dự án hoàn tất, hệ thống chạy ổn định và sẵn sàng scale.
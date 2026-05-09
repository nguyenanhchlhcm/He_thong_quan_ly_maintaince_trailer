# T2M-App Session Handoff (03/05/2026)

Tài liệu này tóm tắt trạng thái hiện tại của dự án để AI có thể tiếp nối công việc ngay lập tức trong phiên chat mới.

## 1. Trạng thái Hiện tại (Current Context)
- **Dự án:** Hệ thống quản lý bảo trì xe (T2M-App) - Next.js 14, Supabase, Tailwind.
- **Tiến độ:** Hoàn tất Phase 8 (Anti-Fraud Imaging) và bắt đầu kiến trúc Storage.

## 2. Các thay đổi quan trọng trong hôm nay (03/05)

### ✅ Tính năng Anti-Fraud (Chống gian lận)
- **Storage Utility (`src/lib/supabase/storage.ts`):** Tạo hàm `uploadBase64Image` để nén và upload ảnh chuẩn WebP lên Supabase Storage bucket `t2m-evidence`.
- **Giao diện Thợ máy (`TicketForm.tsx`):**
    - Bắt buộc chụp ảnh **ODO (Số Km)** khi tạo phiếu.
    - Tự động hiện ô chụp **Hóa đơn** khi nhập "Tiền công thợ ngoài" > 0.
    - Thêm 4 ô chụp **Check-in 4 góc xe** (Tùy chọn).
- **Quản lý Lốp xe (`TireDialog.tsx`):**
    - Bắt buộc chụp **Serial Lốp** và **Gai lốp** khi chuyển trạng thái sang "Thanh lý" hoặc "Chờ đắp".
    - Ảnh được upload trực tiếp lên Storage và lưu URL vào DB.

### 🛠 Sửa lỗi (Bug Fixes)
- **Infinite Render Loop:** Khắc phục lỗi Form tự động reset vô tận khi lưu bản nháp (do dependencies `draftTicket` và `reset` bị xung đột).
- **Undefined Access:** Sửa lỗi sập trang khi chọn vật tư SKU do `watchParts[index]` chưa kịp khởi tạo.

## 3. Cấu hình Cần nhớ
- **Supabase Bucket:** Đã yêu cầu User tạo bucket `t2m-evidence` (Public).
- **Database:** Đã thêm các cột `odometer_photo_url`, `receipt_photo_url`, `serial_photo_url`, `tread_condition_photo_url` vào các bảng tương ứng.

## 4. Công việc Tiếp theo (Next Steps)
1. **Kiểm tra luồng Sync:** Hiện tại `TicketForm` vẫn đang mock việc upload ảnh khi online. Cần tích hợp `uploadBase64Image` vào luồng `onSubmit` chính thức của thợ máy.
2. **Phase 9 (Offline Storage):** Cải thiện IndexedDB để lưu trữ nhiều ảnh base64 hơn mà không làm chậm App.
3. **Phase 14 (Manager Audit Dashboard):** Xây dựng trang duyệt phiếu cho Manager, hiển thị trực quan các ảnh ODO, Hóa đơn và Vật tư để đối soát.

---
**Instruction cho AI phiên tới:** 
*Hãy đọc file `@docs/session_handoff.md` và `docs/T2M-App Master Plan.md` để nắm bắt ngữ cảnh. Tiếp tục thực hiện việc tích hợp hàm upload ảnh thực tế vào luồng `onSubmit` của TicketForm.*

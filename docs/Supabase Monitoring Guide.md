# **📊 HƯỚNG DẪN GIÁM SÁT TÀI NGUYÊN (SUPABASE FREE TIER)**

Hệ thống T2M-App vận hành trên gói Miễn phí của Supabase. Để đảm bảo hệ thống không bị gián đoạn, người quản trị cần lưu ý các hạn mức sau:

---

## **1. CÁC HẠN MỨC QUAN TRỌNG**
| Tài nguyên | Hạn mức Free Tier | Lưu ý của T2M-App |
| :--- | :--- | :--- |
| **Database** | 500 MB | Chứa thông tin xe, phiếu sửa chữa. Rất khó đầy trong 1-2 năm đầu. |
| **Storage (Ảnh)** | 1 GB | **Điểm yếu nhất.** Chứa ảnh vật tư CŨ/MỚI. Cần được giám sát chặt chẽ. |
| **Auth Users** | 50,000 MAU | Thoải mái cho quy mô Gara. |
| **Egress (Băng thông)** | 2 GB / tháng | Hạn chế xem lại ảnh cũ quá nhiều để tiết kiệm. |

---

## **2. CHIẾN LƯỢC TỐI ƯU HÓA (ĐÃ CÀI ĐẶT)**
Chúng ta đã triển khai các biện pháp sau để kéo dài thời gian dùng gói Free:
1. **Nén ảnh tại Client:** Mọi ảnh thợ máy chụp đều được nén xuống dưới 100KB (chuẩn WebP 800x800px) trước khi tải lên. Với 1GB Storage, chúng ta có thể lưu được khoảng **10,000 bức ảnh**.
2. **React Query Caching:** Giảm số lần gọi API vào Database, giúp tiết kiệm băng thông và tài nguyên CPU của Supabase.

---

## **3. CÁCH KIỂM TRA HÀNG THÁNG**
1. Đăng nhập vào [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn dự án **T2M-App**.
3. Vào mục **Organization** -> **Usage**.
4. Kiểm tra thanh trạng thái tại mục **Storage** và **Database Size**.

---

## **4. HÀNH ĐỘNG KHI SẮP ĐẦY TÀI NGUYÊN**
Nếu dung lượng Storage vượt quá 80% (800MB):
* **Giải pháp 1 (Thủ công):** Tải các ảnh từ năm trước về lưu trữ nội bộ (Hard drive) và xóa trên Supabase.
* **Giải pháp 2 (Nâng cấp):** Nâng cấp lên gói **Pro ($25/tháng)** để có 8GB Database và 100GB Storage. Giải pháp này phù hợp khi quy mô đội xe tăng lên trên 100 đầu xe.

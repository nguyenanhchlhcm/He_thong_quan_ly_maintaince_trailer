# **🚛 Truck & Trailer Maintenance Web App (T2M-App)**

## **📖 Tổng quan dự án (Overview)**

T2M-App (Truck & Trailer Maintenance) là hệ thống Web App ERP mini dành cho doanh nghiệp vận tải. Hệ thống giúp số hóa toàn bộ quy trình bảo trì, sửa chữa xe container, chống thất thoát phụ tùng (luộc đồ), theo dõi định mức chi phí (CP/KM) và tự động hóa cảnh báo bảo dưỡng.

Dự án này được thiết kế theo kiến trúc Module (Master Data, Asset & HR, Workflow, Inventory & Finance) và ưu tiên khả năng hoạt động trên thiết bị di động (Mobile-first) cho thợ máy tại Gara.

## **🧠 Tài liệu dành cho AI Agent (AI Context Files)**

Khi làm việc với repository này, AI Agent **BẮT BUỘC** phải đọc và tuân thủ các tài liệu sau trước khi sinh code:

1. [AI System Rules (ai\_appsheet\_rules.md)](http://docs.google.com/docs/ai_appsheet_rules.md) \- Các quy tắc chống gian lận và nguyên tắc bất biến của hệ thống.  
2. [Database Schema (ai\_appsheet\_prompt.md)](http://docs.google.com/docs/ai_appsheet_prompt.md) \- Cấu trúc dữ liệu và logic quan hệ.  
3. [Architecture (ARCHITECTURE.md)](http://docs.google.com/docs/ARCHITECTURE.md) \- Quy chuẩn thiết kế thư mục và component.

## **🛠️ Tech Stack (Ưu tiên Free Tier)**

Hệ thống được thiết kế để vận hành hoàn toàn miễn phí (với quy mô vừa và nhỏ) dựa trên các gói Free Tier tốt nhất hiện nay:

* **Frontend:** Next.js 14 (App Router), React, TypeScript.  
* **Hosting:** Vercel (Free tier \- Hobby Plan, miễn phí băng thông và serverless functions cơ bản).  
* **Styling:** Tailwind CSS, Shadcn UI (Open-source, miễn phí 100%).  
* **State Management:** Zustand (Client state), React Query (Server state).  
* **Database & Auth:** Supabase (PostgreSQL). Gói Free cung cấp 500MB Database, 1GB Storage (lưu ảnh vật tư) và 50,000 MAU (người dùng active) \- Rất dư dả cho 1 Gara.  
* **Maps/Location (Zero Cost):** \* Sử dụng **HTML5 Geolocation API** để lấy tọa độ điện thoại.  
  * Hiển thị bản đồ bằng **Leaflet \+ OpenStreetMap (OSM)** (Miễn phí 100%, không cần API Key).  
  * Tính toán khoảng cách (chống Fake GPS) bằng thuật toán **Haversine formula** chạy local bằng JavaScript, không gọi API tính phí.

## **🚀 Cấu trúc thư mục (Folder Structure)**

├── src/  
│   ├── app/             \# Next.js App Router (Pages & Layouts)  
│   ├── components/      \# Reusable UI components (Buttons, Modals, Maps)  
│   ├── features/        \# Phân chia theo Module (MasterData, Workflow, Asset)  
│   ├── hooks/           \# Custom React Hooks (vd: useGPS, useOfflineSync)  
│   ├── lib/             \# Utility functions (Supabase client, Haversine distance)  
│   ├── types/           \# TypeScript definitions (Schema interfaces)  
│   └── store/           \# Zustand state management  
├── docs/                \# Chứa các tài liệu Rules, Schema, PRD  
├── public/              \# Static assets (Images, Icons)  
└── README.md            \# File này

## **⚙️ Cài đặt môi trường (Local Development)**

**1\. Clone repository:**

git clone \[https://github.com/your-org/t2m-webapp.git\](https://github.com/your-org/t2m-webapp.git)  
cd t2m-webapp

**2\. Cài đặt thư viện (Dependencies):**

npm install  
\# hoặc  
pnpm install

**3\. Biến môi trường (.env):**

Copy file .env.example thành .env.local và điền các khóa API. (Chỉ cần Supabase, không cần Google Maps API):

NEXT\_PUBLIC\_SUPABASE\_URL=your\_supabase\_project\_url  
NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your\_supabase\_anon\_key

**4\. Chạy server phát triển:**

npm run dev  
\# Mở http://localhost:3000 để xem kết quả

## **🔒 Phân quyền cơ bản (Roles)**

Hệ thống sử dụng Role-Based Access Control (RBAC):

* MECHANIC: Chỉ có quyền tạo Phiếu bảo trì, thêm vật tư, chụp ảnh. Giao diện tối giản.  
* MANAGER: Quyền duyệt giá, xem chi phí, xác nhận hoàn thành sửa chữa.  
* ADMIN: Toàn quyền quản lý danh mục (Xe, Vật tư, Gara).

## **📝 Lưu ý quan trọng cho Developer/AI**

* **Offline-First:** Thợ máy thường làm việc dưới gầm xe, sóng yếu. Mọi form nhập liệu (đặc biệt là PHIEU\_BAO\_TRI) cần có cơ chế lưu cache bằng **IndexedDB** (sử dụng localforage hoặc thư viện tương tự) trước khi đồng bộ lên Supabase.  
* **Tối ưu hình ảnh (Bắt buộc để tiết kiệm Free Tier Storage):** Hình ảnh vật tư (cũ/mới) tải lên phải được nén, resize về chuẩn WebP hoặc JPEG với kích thước tối đa 800x800px tại **Client-side** (bằng JS) *trước khi* upload lên Supabase Storage bucket.
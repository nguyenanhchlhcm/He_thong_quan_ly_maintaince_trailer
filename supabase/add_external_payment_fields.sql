-- SQL Migration: Add VietQR payment columns to phieu_bao_tri

ALTER TABLE public.phieu_bao_tri
ADD COLUMN IF NOT EXISTS ngan_hang_ngoai TEXT,
ADD COLUMN IF NOT EXISTS so_tai_khoan_ngoai TEXT,
ADD COLUMN IF NOT EXISTS ten_tai_khoan_ngoai TEXT,
ADD COLUMN IF NOT EXISTS trang_thai_thanh_toan TEXT CHECK (trang_thai_thanh_toan IN ('Chờ thanh toán', 'Đã thanh toán')) DEFAULT 'Chờ thanh toán';

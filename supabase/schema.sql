-- T2M-App: Database Schema & RLS Policies

-- 1. Profiles Table (RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    role TEXT CHECK (role IN ('ADMIN', 'MANAGER', 'MECHANIC')) DEFAULT 'MECHANIC',
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Master Data: Gara
CREATE TABLE IF NOT EXISTS public.danh_muc_gara (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_gara TEXT NOT NULL,
    dia_chi TEXT,
    toa_do_lat FLOAT,
    toa_do_lng FLOAT,
    loai_gara TEXT CHECK (loai_gara IN ('Nội bộ', 'Hợp tác đối tác')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Master Data: Vật tư SKU
CREATE TABLE IF NOT EXISTS public.danh_muc_vat_tu_sku (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_vat_tu TEXT NOT NULL,
    nhom_vat_tu TEXT CHECK (nhom_vat_tu IN ('Động cơ', 'Gầm', 'Điện', 'Lốp', 'Máy lạnh')),
    don_vi_tinh TEXT CHECK (don_vi_tinh IN ('Cái', 'Bộ', 'Can', 'Lít', 'Gói')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Asset: Danh sách xe
CREATE TABLE IF NOT EXISTS public.danh_sach_xe (
    id_xe TEXT PRIMARY KEY, -- Thường dùng biển số xe làm ID
    bien_so TEXT NOT NULL,
    loai_xe TEXT CHECK (loai_xe IN ('Đầu kéo', 'Rơ-moóc', 'Xe tải')),
    so_km_hien_tai NUMERIC DEFAULT 0,
    so_gio_may NUMERIC DEFAULT 0,
    toa_do_xe_gps_lat FLOAT,
    toa_do_xe_gps_lng FLOAT,
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Asset: Quản lý lốp xe (Rule 5: Serial Number uniqueness)
CREATE TABLE IF NOT EXISTS public.quan_ly_vo_xe (
    id_vo TEXT PRIMARY KEY, -- Physical Serial Number
    id_xe TEXT REFERENCES public.danh_sach_xe(id_xe) ON DELETE SET NULL,
    vi_tri_lap TEXT, -- e.g., 'Vỏ 1', 'Vỏ 2'
    tinh_trang_gai NUMERIC,
    trang_thai_vo TEXT CHECK (trang_thai_vo IN ('Đang chạy', 'Chờ đắp', 'Thanh lý')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Workflow: Phiếu bảo trì
CREATE TABLE IF NOT EXISTS public.phieu_bao_tri (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_xe TEXT REFERENCES public.danh_sach_xe(id_xe),
    id_tho_may UUID REFERENCES auth.users(id),
    toa_do_app_lat FLOAT,
    toa_do_app_lng FLOAT,
    canh_bao_gps BOOLEAN DEFAULT FALSE,
    trang_thai_phieu TEXT CHECK (trang_thai_phieu IN ('Báo giá', 'Chờ duyệt', 'Đang sửa', 'Đã xong')) DEFAULT 'Báo giá',
    tong_vat_tu NUMERIC DEFAULT 0,
    tien_cong NUMERIC DEFAULT 0,
    tong_chi_phi NUMERIC DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Workflow: Chi tiết vật tư sử dụng (Rule 1: Visual Proof)
CREATE TABLE IF NOT EXISTS public.chi_tiet_vat_tu_su_dung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_phieu UUID REFERENCES public.phieu_bao_tri(id) ON DELETE CASCADE,
    id_sku UUID REFERENCES public.danh_muc_vat_tu_sku(id),
    so_luong NUMERIC DEFAULT 1,
    don_gia NUMERIC DEFAULT 0,
    thanh_tien NUMERIC DEFAULT 0,
    anh_vat_tu_cu_url TEXT NOT NULL, -- Rule 1
    anh_vat_tu_moi_url TEXT NOT NULL, -- Rule 1
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.danh_muc_gara ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.danh_muc_vat_tu_sku ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.danh_sach_xe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quan_ly_vo_xe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phieu_bao_tri ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chi_tiet_vat_tu_su_dung ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles: Anyone can view their own, Admin can view all
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Master Data: Everyone can view
CREATE POLICY "Public read for gara" ON public.danh_muc_gara FOR SELECT USING (true);
CREATE POLICY "Public read for sku" ON public.danh_muc_vat_tu_sku FOR SELECT USING (true);
CREATE POLICY "Public read for xe" ON public.danh_sach_xe FOR SELECT USING (true);
CREATE POLICY "Public read for vo_xe" ON public.quan_ly_vo_xe FOR SELECT USING (true);

-- Maintenance Tickets:
-- Mechanics can see their own
CREATE POLICY "Mechanics can see own tickets" ON public.phieu_bao_tri
    FOR SELECT USING (auth.uid() = id_tho_may);

-- Mechanics can insert tickets
CREATE POLICY "Mechanics can create tickets" ON public.phieu_bao_tri
    FOR INSERT WITH CHECK (auth.uid() = id_tho_may);

-- Managers can see all
CREATE POLICY "Managers can see all tickets" ON public.phieu_bao_tri
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN'))
    );

-- Managers can update status
CREATE POLICY "Managers can update ticket status" ON public.phieu_bao_tri
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN'))
    );

-- Chi tiết vật tư: Similar policies
CREATE POLICY "Mechanics can see own ticket details" ON public.chi_tiet_vat_tu_su_dung
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.phieu_bao_tri WHERE id = id_phieu AND id_tho_may = auth.uid())
    );

CREATE POLICY "Mechanics can insert ticket details" ON public.chi_tiet_vat_tu_su_dung
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.phieu_bao_tri WHERE id = id_phieu AND id_tho_may = auth.uid())
    );

CREATE POLICY "Managers can see all ticket details" ON public.chi_tiet_vat_tu_su_dung
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN'))
    );

-- =====================================================================================
-- Auth Trigger: Auto-create Profile on Signup
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'MECHANIC')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

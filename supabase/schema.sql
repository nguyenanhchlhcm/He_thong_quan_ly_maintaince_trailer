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
    gia_tham_khao NUMERIC DEFAULT 0,
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

-- 5. Asset: Quản lý lốp xe
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
    so_km_luc_sua NUMERIC, 
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

-- 7. Workflow: Chi tiết vật tư sử dụng
CREATE TABLE IF NOT EXISTS public.chi_tiet_vat_tu_su_dung (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_phieu UUID REFERENCES public.phieu_bao_tri(id) ON DELETE CASCADE,
    id_sku UUID REFERENCES public.danh_muc_vat_tu_sku(id),
    so_luong NUMERIC DEFAULT 1,
    don_gia NUMERIC DEFAULT 0,
    thanh_tien NUMERIC DEFAULT 0,
    anh_vat_tu_cu_url TEXT NOT NULL, 
    anh_vat_tu_moi_url TEXT NOT NULL, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Master Data: Khách hàng
CREATE TABLE IF NOT EXISTS public.danh_muc_khach_hang (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_khach_hang TEXT NOT NULL,
    sdt TEXT,
    ma_so_thue TEXT,
    hang_khach TEXT DEFAULT 'Standard',
    cong_no NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Master Data: Nhà cung cấp
CREATE TABLE IF NOT EXISTS public.danh_muc_nha_cung_cap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_ncc TEXT NOT NULL,
    nhom_cung_cap TEXT,
    lien_he TEXT,
    rating NUMERIC DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Master Data: Danh mục dịch vụ/tiền công
CREATE TABLE IF NOT EXISTS public.danh_muc_dich_vu (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ten_dich_vu TEXT NOT NULL,
    don_gia_chuan NUMERIC DEFAULT 0,
    sla_du_kien TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Workflow: Nhật ký bảo trì định kỳ (Preventive Logs)
CREATE TABLE IF NOT EXISTS public.preventive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_xe TEXT REFERENCES public.danh_sach_xe(id_xe),
    noi_dung_bao_tri TEXT,
    so_km_thuc_hien NUMERIC,
    ngay_thuc_hien DATE DEFAULT CURRENT_DATE,
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
ALTER TABLE public.danh_muc_khach_hang ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.danh_muc_nha_cung_cap ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.danh_muc_dich_vu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventive_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

-- Master Data: Public Read
CREATE POLICY "Public read for gara" ON public.danh_muc_gara FOR SELECT USING (true);
CREATE POLICY "Public read for sku" ON public.danh_muc_vat_tu_sku FOR SELECT USING (true);
CREATE POLICY "Public read for xe" ON public.danh_sach_xe FOR SELECT USING (true);
CREATE POLICY "Public read for vo_xe" ON public.quan_ly_vo_xe FOR SELECT USING (true);
CREATE POLICY "Public read for customers" ON public.danh_muc_khach_hang FOR SELECT USING (true);
CREATE POLICY "Public read for suppliers" ON public.danh_muc_nha_cung_cap FOR SELECT USING (true);
CREATE POLICY "Public read for services" ON public.danh_muc_dich_vu FOR SELECT USING (true);
CREATE POLICY "Public read for preventive_logs" ON public.preventive_logs FOR SELECT USING (true);

-- Maintenance Tickets
CREATE POLICY "Mechanics can see own tickets" ON public.phieu_bao_tri FOR SELECT USING (auth.uid() = id_tho_may);
CREATE POLICY "Mechanics can create tickets" ON public.phieu_bao_tri FOR INSERT WITH CHECK (auth.uid() = id_tho_may);
CREATE POLICY "Managers can see all tickets" ON public.phieu_bao_tri FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN')));
CREATE POLICY "Managers can update ticket status" ON public.phieu_bao_tri FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN')));

-- Ticket Details
CREATE POLICY "Mechanics can see own ticket details" ON public.chi_tiet_vat_tu_su_dung FOR SELECT USING (EXISTS (SELECT 1 FROM public.phieu_bao_tri WHERE id = id_phieu AND id_tho_may = auth.uid()));
CREATE POLICY "Mechanics can insert ticket details" ON public.chi_tiet_vat_tu_su_dung FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.phieu_bao_tri WHERE id = id_phieu AND id_tho_may = auth.uid()));
CREATE POLICY "Managers can see all ticket details" ON public.chi_tiet_vat_tu_su_dung FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('MANAGER', 'ADMIN')));

-- =====================================================================================
-- BUSINESS LOGIC TRIGGERS
-- =====================================================================================

-- 1. Cost Integrity: Update total price on ticket
CREATE OR REPLACE FUNCTION public.update_ticket_totals()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.phieu_bao_tri
    SET 
        tong_vat_tu = (SELECT COALESCE(SUM(thanh_tien), 0) FROM public.chi_tiet_vat_tu_su_dung WHERE id_phieu = COALESCE(NEW.id_phieu, OLD.id_phieu)),
        tong_chi_phi = (SELECT COALESCE(SUM(thanh_tien), 0) FROM public.chi_tiet_vat_tu_su_dung WHERE id_phieu = COALESCE(NEW.id_phieu, OLD.id_phieu)) + tien_cong,
        last_updated = NOW()
    WHERE id = COALESCE(NEW.id_phieu, OLD.id_phieu);
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_detail_change ON public.chi_tiet_vat_tu_su_dung;
CREATE TRIGGER on_ticket_detail_change
AFTER INSERT OR UPDATE OR DELETE ON public.chi_tiet_vat_tu_su_dung
FOR EACH ROW EXECUTE FUNCTION public.update_ticket_totals();

-- 2. Approval Integrity: Reset to 'Báo giá' if items change
CREATE OR REPLACE FUNCTION public.reset_ticket_status()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.phieu_bao_tri
    SET trang_thai_phieu = 'Báo giá'
    WHERE id = NEW.id_phieu AND trang_thai_phieu NOT IN ('Báo giá', 'Đã xong');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_detail_modified_reset_status ON public.chi_tiet_vat_tu_su_dung;
CREATE TRIGGER on_ticket_detail_modified_reset_status
AFTER UPDATE ON public.chi_tiet_vat_tu_su_dung
FOR EACH ROW EXECUTE FUNCTION public.reset_ticket_status();

-- 3. Odometer Sync: Update Vehicle KM when ticket is completed
CREATE OR REPLACE FUNCTION public.sync_vehicle_odometer()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.trang_thai_phieu = 'Đã xong' AND OLD.trang_thai_phieu <> 'Đã xong') THEN
        UPDATE public.danh_sach_xe
        SET so_km_hien_tai = NEW.so_km_luc_sua
        WHERE id_xe = NEW.id_xe;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ticket_completed_sync_km ON public.phieu_bao_tri;
CREATE TRIGGER on_ticket_completed_sync_km
AFTER UPDATE ON public.phieu_bao_tri
FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_odometer();

-- 4. Auth Trigger: Auto-create Profile on Signup
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

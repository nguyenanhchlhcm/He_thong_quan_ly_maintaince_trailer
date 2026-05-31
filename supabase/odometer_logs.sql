-- T2M-App: Odometer Logging & Automatic Tire Mileage Distribution

-- 1. Create odometer_logs table
CREATE TABLE IF NOT EXISTS public.odometer_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_xe TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    id_mooc TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
    odometer_cu INT NOT NULL,
    odometer_moi INT NOT NULL,
    delta_km INT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add so_km_da_chay column to quan_ly_vo_xe table
ALTER TABLE public.quan_ly_vo_xe ADD COLUMN IF NOT EXISTS so_km_da_chay INT DEFAULT 0;

-- 3. Trigger BEFORE INSERT: Calculate delta and enforce QA rules
-- Cho phép số KM bất thường nếu đã chụp ảnh xác minh (photo_url không NULL)
CREATE OR REPLACE FUNCTION public.calculate_odometer_delta()
RETURNS TRIGGER AS $$
BEGIN
    NEW.delta_km := NEW.odometer_moi - NEW.odometer_cu;
    IF (NEW.delta_km < 0 OR NEW.delta_km > 1500) AND (NEW.photo_url IS NULL OR NEW.photo_url = '') THEN
        RAISE EXCEPTION 'Số KM bất thường (delta: % km). Vui lòng chụp ảnh Taplo xác minh.', NEW.delta_km;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_odometer_delta ON public.odometer_logs;
CREATE TRIGGER trg_calculate_odometer_delta
BEFORE INSERT ON public.odometer_logs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_odometer_delta();

-- 4. Trigger AFTER INSERT: Sync vehicle odometer and distribute tire mileage
CREATE OR REPLACE FUNCTION public.after_odometer_log_inserted()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. UPDATE vehicles SET odometer = NEW.odometer_moi WHERE id = NEW.id_xe
    UPDATE public.vehicles 
    SET odometer = NEW.odometer_moi, 
        so_km_hien_tai = NEW.odometer_moi 
    WHERE id = NEW.id_xe;

    -- 2. UPDATE quan_ly_vo_xe SET so_km_da_chay = so_km_da_chay + NEW.delta_km WHERE id_xe = NEW.id_xe AND trang_thai_vo = 'Đang chạy'
    UPDATE public.quan_ly_vo_xe 
    SET so_km_da_chay = COALESCE(so_km_da_chay, 0) + NEW.delta_km 
    WHERE id_xe = NEW.id_xe AND trang_thai_vo = 'Đang chạy';

    -- 3. IF NEW.id_mooc IS NOT NULL THEN UPDATE quan_ly_vo_xe SET so_km_da_chay = so_km_da_chay + NEW.delta_km WHERE id_xe = NEW.id_mooc AND trang_thai_vo = 'Đang chạy'
    IF NEW.id_mooc IS NOT NULL THEN
        UPDATE public.quan_ly_vo_xe 
        SET so_km_da_chay = COALESCE(so_km_da_chay, 0) + NEW.delta_km 
        WHERE id_xe = NEW.id_mooc AND trang_thai_vo = 'Đang chạy';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_after_odometer_log_inserted ON public.odometer_logs;
CREATE TRIGGER trg_after_odometer_log_inserted
AFTER INSERT ON public.odometer_logs
FOR EACH ROW
EXECUTE FUNCTION public.after_odometer_log_inserted();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.odometer_logs ENABLE ROW LEVEL SECURITY;

-- 6. Add RLS Policies
DROP POLICY IF EXISTS "Public read for odometer_logs" ON public.odometer_logs;
CREATE POLICY "Public read for odometer_logs" ON public.odometer_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Insert for all users" ON public.odometer_logs;
CREATE POLICY "Insert for all users" ON public.odometer_logs FOR INSERT WITH CHECK (true);

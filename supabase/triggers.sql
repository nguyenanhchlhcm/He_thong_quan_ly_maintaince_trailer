-- T2M-App: Database Triggers for Data Integrity (Rules 3 & 4)

-- =====================================================================================
-- TRIGGER 1: Tự động tính thành tiền cho từng chi tiết vật tư (Rule 3)
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.calculate_chi_tiet_thanh_tien()
RETURNS TRIGGER AS $$
BEGIN
    NEW.thanh_tien := COALESCE(NEW.so_luong, 0) * COALESCE(NEW.don_gia, 0);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_chi_tiet_thanh_tien ON public.chi_tiet_vat_tu_su_dung;
CREATE TRIGGER trg_calculate_chi_tiet_thanh_tien
BEFORE INSERT OR UPDATE ON public.chi_tiet_vat_tu_su_dung
FOR EACH ROW
EXECUTE FUNCTION public.calculate_chi_tiet_thanh_tien();

-- =====================================================================================
-- TRIGGER 2: Kích hoạt cập nhật Phiếu bảo trì khi Chi tiết thay đổi
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.touch_phieu_bao_tri()
RETURNS TRIGGER AS $$
DECLARE
    v_id_phieu UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_id_phieu := OLD.id_phieu;
    ELSE
        v_id_phieu := NEW.id_phieu;
    END IF;

    -- Update last_updated để kích hoạt Trigger 3 trên bảng phieu_bao_tri
    UPDATE public.phieu_bao_tri
    SET last_updated = NOW()
    WHERE id = v_id_phieu;

    RETURN NULL; -- Dùng AFTER trigger nên return NULL là hợp lệ
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_phieu_bao_tri ON public.chi_tiet_vat_tu_su_dung;
CREATE TRIGGER trg_touch_phieu_bao_tri
AFTER INSERT OR UPDATE OR DELETE ON public.chi_tiet_vat_tu_su_dung
FOR EACH ROW
EXECUTE FUNCTION public.touch_phieu_bao_tri();

-- =====================================================================================
-- TRIGGER 3: Enforce Rules 3 (Cost Integrity) & 4 (Approval Workflow) trên Phiếu
-- =====================================================================================
CREATE OR REPLACE FUNCTION public.enforce_phieu_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Rule 3: Ép buộc tong_vat_tu phải bằng tổng thực tế dưới DB
    -- Loại bỏ hoàn toàn khả năng submit sai giá từ Frontend
    SELECT COALESCE(SUM(thanh_tien), 0) INTO NEW.tong_vat_tu
    FROM public.chi_tiet_vat_tu_su_dung
    WHERE id_phieu = NEW.id;

    -- Tính lại tổng chi phí (Vật tư + Tiền công)
    NEW.tong_chi_phi := NEW.tong_vat_tu + COALESCE(NEW.tien_cong, 0);

    IF TG_OP = 'UPDATE' THEN
        -- Rule 4: Nếu tổng chi phí thay đổi, bắt buộc đưa trạng thái về 'Báo giá' để duyệt lại
        IF NEW.tong_chi_phi <> OLD.tong_chi_phi THEN
            NEW.trang_thai_phieu := 'Báo giá';
        END IF;
    END IF;

    -- Rule 2: GPS Verification (App coordinates vs Xe coordinates)
    IF NEW.toa_do_app_lat IS NOT NULL AND NEW.toa_do_app_lng IS NOT NULL AND NEW.id_xe IS NOT NULL THEN
        DECLARE
            v_xe_lat FLOAT;
            v_xe_lng FLOAT;
            v_distance FLOAT;
        BEGIN
            SELECT toa_do_xe_gps_lat, toa_do_xe_gps_lng INTO v_xe_lat, v_xe_lng
            FROM public.danh_sach_xe
            WHERE id_xe = NEW.id_xe;

            IF v_xe_lat IS NOT NULL AND v_xe_lng IS NOT NULL THEN
                -- Haversine formula inline calculation for simplicity, or we can assume extension exists.
                -- R = 6371 km
                v_distance := 6371 * 2 * ASIN(SQRT(
                    POWER(SIN(RADIANS(v_xe_lat - NEW.toa_do_app_lat) / 2), 2) +
                    COS(RADIANS(NEW.toa_do_app_lat)) * COS(RADIANS(v_xe_lat)) *
                    POWER(SIN(RADIANS(v_xe_lng - NEW.toa_do_app_lng) / 2), 2)
                ));
                
                IF v_distance > 1.0 THEN
                    NEW.canh_bao_gps := TRUE;
                ELSE
                    NEW.canh_bao_gps := FALSE;
                END IF;
            END IF;
        END;
    END IF;

    NEW.last_updated := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_phieu_rules ON public.phieu_bao_tri;
CREATE TRIGGER trg_enforce_phieu_rules
BEFORE INSERT OR UPDATE ON public.phieu_bao_tri
FOR EACH ROW
EXECUTE FUNCTION public.enforce_phieu_rules();

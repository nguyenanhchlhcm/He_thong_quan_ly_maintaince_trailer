-- 1. Create system_alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_id TEXT NOT NULL,
    type TEXT CHECK (type IN ('BẢO TRÌ', 'GIAN LẬN')) NOT NULL,
    message TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('HIGH', 'CRITICAL')) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notified_telegram BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.system_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
DROP POLICY IF EXISTS "Allow select for ADMIN/MANAGER" ON public.system_alerts;
CREATE POLICY "Allow select for ADMIN/MANAGER" ON public.system_alerts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'MANAGER')
        )
    );

DROP POLICY IF EXISTS "Allow update for ADMIN/MANAGER" ON public.system_alerts;
CREATE POLICY "Allow update for ADMIN/MANAGER" ON public.system_alerts
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('ADMIN', 'MANAGER')
        )
    );

-- 4. DB Function to generate alerts
CREATE OR REPLACE FUNCTION public.generate_maintenance_alerts()
RETURNS void AS $$
DECLARE
    v_rec RECORD;
    p_rec RECORD;
    v_msg TEXT;
    v_sev TEXT;
BEGIN
    -- A. DELETE alerts that are no longer active (resolved or conditions no longer met)
    
    -- Delete maintenance alerts for vehicles that no longer meet the criteria
    DELETE FROM public.system_alerts
    WHERE type = 'BẢO TRÌ'
      AND is_resolved = FALSE
      AND target_id NOT IN (
          SELECT id FROM public.vehicles 
          WHERE next_maintenance_km > 0 
            AND odometer >= (next_maintenance_km - 500)
      );

    -- Delete GPS fraud alerts for tickets that no longer meet the criteria
    DELETE FROM public.system_alerts
    WHERE type = 'GIAN LẬN'
      AND is_resolved = FALSE
      AND target_id NOT IN (
          SELECT id::text FROM public.phieu_bao_tri 
          WHERE canh_bao_gps = TRUE 
            AND trang_thai_phieu <> 'Đã xong'
      );

    -- B. UPSERT maintenance alerts
    FOR v_rec IN 
        SELECT id, bien_so, odometer, next_maintenance_km 
        FROM public.vehicles 
        WHERE next_maintenance_km > 0 
          AND odometer >= (next_maintenance_km - 500)
    LOOP
        IF v_rec.odometer >= v_rec.next_maintenance_km THEN
            v_sev := 'CRITICAL';
            v_msg := 'Xe ' || v_rec.bien_so || ' đã quá hạn bảo trì! KM hiện tại: ' || v_rec.odometer || ' km. KM bảo trì tiếp theo: ' || v_rec.next_maintenance_km || ' km.';
        ELSE
            v_sev := 'HIGH';
            v_msg := 'Xe ' || v_rec.bien_so || ' sắp đến hạn bảo trì. KM hiện tại: ' || v_rec.odometer || ' km. KM bảo trì tiếp theo: ' || v_rec.next_maintenance_km || ' km.';
        END IF;

        -- If exists unresolved alert, update message & severity if changed
        IF EXISTS (SELECT 1 FROM public.system_alerts WHERE target_id = v_rec.id AND type = 'BẢO TRÌ' AND is_resolved = FALSE) THEN
            UPDATE public.system_alerts
            SET 
                message = v_msg,
                -- If severity escalated from HIGH to CRITICAL, reset notified_telegram to false to alert again
                notified_telegram = CASE WHEN severity <> v_sev THEN FALSE ELSE notified_telegram END,
                severity = v_sev,
                created_at = NOW() -- refresh timestamp
            WHERE target_id = v_rec.id AND type = 'BẢO TRÌ' AND is_resolved = FALSE AND (severity <> v_sev OR message <> v_msg);
        ELSE
            INSERT INTO public.system_alerts (target_id, type, message, severity, notified_telegram)
            VALUES (v_rec.id, 'BẢO TRÌ', v_msg, v_sev, FALSE);
        END IF;
    END LOOP;

    -- C. UPSERT GPS fraud alerts
    FOR p_rec IN 
        SELECT p.id::text AS id, p.ma_phieu, p.id_xe, v.bien_so
        FROM public.phieu_bao_tri p
        LEFT JOIN public.vehicles v ON p.id_xe = v.id
        WHERE p.canh_bao_gps = TRUE 
          AND p.trang_thai_phieu <> 'Đã xong'
    LOOP
        v_msg := 'Phiếu bảo trì ' || COALESCE(p_rec.ma_phieu, SUBSTRING(p_rec.id, 1, 8)) || ' (Xe ' || COALESCE(p_rec.bien_so, p_rec.id_xe) || ') cảnh báo sai lệch vị trí GPS!';
        
        IF NOT EXISTS (SELECT 1 FROM public.system_alerts WHERE target_id = p_rec.id AND type = 'GIAN LẬN' AND is_resolved = FALSE) THEN
            INSERT INTO public.system_alerts (target_id, type, message, severity, notified_telegram)
            VALUES (p_rec.id, 'GIAN LẬN', v_msg, 'CRITICAL', FALSE);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

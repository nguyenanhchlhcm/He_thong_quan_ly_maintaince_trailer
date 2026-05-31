-- T2M-App: Tire Installation Date Tracking

-- 1. Add ngay_lap_dat column (nullable, set automatically by trigger)
ALTER TABLE public.quan_ly_vo_xe
  ADD COLUMN IF NOT EXISTS ngay_lap_dat TIMESTAMP WITH TIME ZONE;

-- 2. Function: sets ngay_lap_dat when a tire is first assigned to a vehicle
CREATE OR REPLACE FUNCTION public.set_tire_installation_date()
RETURNS TRIGGER AS $$
BEGIN
  -- Fired when id_xe transitions from NULL to a real vehicle id (first install)
  IF OLD.id_xe IS NULL AND NEW.id_xe IS NOT NULL THEN
    NEW.ngay_lap_dat := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger: BEFORE UPDATE so the date is stamped before the row is written
DROP TRIGGER IF EXISTS tg_set_installation_date ON public.quan_ly_vo_xe;
CREATE TRIGGER tg_set_installation_date
BEFORE UPDATE OF id_xe ON public.quan_ly_vo_xe
FOR EACH ROW
EXECUTE FUNCTION public.set_tire_installation_date();

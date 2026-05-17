-- Migration: Fix Tire Management - Align quan_ly_vo_xe with vehicles table
-- Date: 2026-05-17
-- Issue: After renaming danh_sach_xe -> vehicles (id_xe -> id), 
--         quan_ly_vo_xe.id_xe FK is broken
-- Solution: Recreate FK to reference vehicles(id)

-- Step 1: Drop old FK constraint if it exists
ALTER TABLE public.quan_ly_vo_xe 
DROP CONSTRAINT IF EXISTS quan_ly_vo_xe_id_xe_fkey;

-- Step 2: Add new FK to vehicles(id)
ALTER TABLE public.quan_ly_vo_xe 
ADD CONSTRAINT quan_ly_vo_xe_id_xe_fkey 
FOREIGN KEY (id_xe) REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- Step 3: Ensure RLS policies for quan_ly_vo_xe allow proper access
-- (Already has "Public read" policy, but add write policies for authenticated users)
DROP POLICY IF EXISTS "Authenticated users can manage tires" ON public.quan_ly_vo_xe;
CREATE POLICY "Authenticated users can manage tires" 
ON public.quan_ly_vo_xe 
FOR ALL 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Step 4: Create tire_history table if it doesn't exist (for TireHistoryDialog)
CREATE TABLE IF NOT EXISTS public.tire_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_vo TEXT NOT NULL,
    id_xe TEXT,
    vi_tri_lap TEXT,
    trang_thai_vo TEXT,
    action TEXT, -- 'Gán xe', 'Tháo lốp', 'Đảo vị trí', 'Thanh lý'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.tire_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read for tire history" ON public.tire_history;
CREATE POLICY "Public read for tire history" 
ON public.tire_history 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert tire history" ON public.tire_history;
CREATE POLICY "Authenticated users can insert tire history" 
ON public.tire_history 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Step 5: Trigger to auto-log tire assignment changes
CREATE OR REPLACE FUNCTION public.log_tire_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        -- Log if vehicle or position changed
        IF (OLD.id_xe IS DISTINCT FROM NEW.id_xe OR OLD.vi_tri_lap IS DISTINCT FROM NEW.vi_tri_lap) THEN
            INSERT INTO public.tire_history (id_vo, id_xe, vi_tri_lap, trang_thai_vo, action)
            VALUES (
                NEW.id_vo,
                NEW.id_xe,
                NEW.vi_tri_lap,
                NEW.trang_thai_vo,
                CASE 
                    WHEN OLD.id_xe IS NULL AND NEW.id_xe IS NOT NULL THEN 'Gán xe'
                    WHEN OLD.id_xe IS NOT NULL AND NEW.id_xe IS NULL THEN 'Tháo lốp'
                    ELSE 'Đảo vị trí'
                END
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.tire_history (id_vo, id_xe, vi_tri_lap, trang_thai_vo, action)
        VALUES (NEW.id_vo, NEW.id_xe, NEW.vi_tri_lap, NEW.trang_thai_vo, 'Nhập kho');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_tire_change_log_history ON public.quan_ly_vo_xe;
CREATE TRIGGER on_tire_change_log_history
AFTER INSERT OR UPDATE ON public.quan_ly_vo_xe
FOR EACH ROW EXECUTE FUNCTION public.log_tire_assignment();

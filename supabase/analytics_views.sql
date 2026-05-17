-- Migration: Analytics Views for Dashboard
-- Date: 2026-05-17
-- Purpose: Create database views for efficient analytics queries

-- 1. Monthly Cost View (already expected by frontend)
CREATE OR REPLACE VIEW public.maintenance_costs_monthly AS
SELECT 
    TO_CHAR(created_at, 'YYYY-MM') AS month,
    COALESCE(SUM(tong_chi_phi), 0) AS total_cost,
    COUNT(*) AS ticket_count
FROM public.phieu_bao_tri
WHERE trang_thai_phieu = 'Đã xong'
GROUP BY TO_CHAR(created_at, 'YYYY-MM')
ORDER BY month;

-- 2. Cost per Vehicle View
CREATE OR REPLACE VIEW public.cost_per_vehicle AS
SELECT 
    v.id,
    v.bien_so,
    v.loai_xe,
    v.so_km_hien_tai,
    COUNT(pbt.id) AS total_tickets,
    COALESCE(SUM(pbt.tong_chi_phi), 0) AS total_cost,
    CASE 
        WHEN v.so_km_hien_tai > 0 THEN COALESCE(SUM(pbt.tong_chi_phi), 0) / v.so_km_hien_tai
        ELSE 0
    END AS cp_km
FROM public.vehicles v
LEFT JOIN public.phieu_bao_tri pbt ON pbt.id_xe = v.id AND pbt.trang_thai_phieu = 'Đã xong'
GROUP BY v.id, v.bien_so, v.loai_xe, v.so_km_hien_tai
ORDER BY total_cost DESC;

-- 3. Cost per Garage View
CREATE OR REPLACE VIEW public.cost_per_garage AS
SELECT 
    g.id,
    g.name AS ten_gara,
    g.address AS dia_chi,
    COUNT(pbt.id) AS total_tickets,
    COALESCE(SUM(pbt.tong_chi_phi), 0) AS total_cost,
    COUNT(DISTINCT pbt.id_xe) AS unique_vehicles
FROM public.garages g
LEFT JOIN public.phieu_bao_tri pbt ON pbt.id_gara = g.id AND pbt.trang_thai_phieu = 'Đã xong'
GROUP BY g.id, g.name, g.address
ORDER BY total_cost DESC;

-- 4. Overall CP/KM Stat View
CREATE OR REPLACE VIEW public.overall_cp_km AS
SELECT 
    COALESCE(SUM(pbt.tong_chi_phi), 0) AS total_cost,
    COUNT(pbt.id) AS total_tickets,
    AVG(v.so_km_hien_tai) AS avg_odometer,
    CASE 
        WHEN SUM(v.so_km_hien_tai) > 0 THEN COALESCE(SUM(pbt.tong_chi_phi), 0) / NULLIF(SUM(v.so_km_hien_tai), 0)
        ELSE 0
    END AS avg_cp_km
FROM public.phieu_bao_tri pbt
JOIN public.vehicles v ON pbt.id_xe = v.id
WHERE pbt.trang_thai_phieu = 'Đã xong';

-- Grant access to authenticated users
GRANT SELECT ON public.maintenance_costs_monthly TO authenticated;
GRANT SELECT ON public.cost_per_vehicle TO authenticated;
GRANT SELECT ON public.cost_per_garage TO authenticated;
GRANT SELECT ON public.overall_cp_km TO authenticated;

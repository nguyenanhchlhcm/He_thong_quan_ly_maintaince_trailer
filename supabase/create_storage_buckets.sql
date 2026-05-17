-- Migration: Create Supabase Storage Buckets
-- Date: 2026-05-17
-- Purpose: Create required storage buckets for image uploads

-- 1. Create 't2m-evidence' bucket (for maintenance evidence photos)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    't2m-evidence',
    't2m-evidence',
    true,
    10485760, -- 10MB max file size
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create 'maintenance' bucket (alternative bucket used in some code paths)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'maintenance',
    'maintenance',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Allow authenticated users to upload to any bucket
CREATE POLICY "Authenticated users can upload evidence"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id IN ('t2m-evidence', 'maintenance'));

-- 4. Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update evidence"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id IN ('t2m-evidence', 'maintenance'));

-- 5. Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete evidence"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id IN ('t2m-evidence', 'maintenance'));

-- 6. Allow public read access (buckets are public, but explicit policy helps)
CREATE POLICY "Public can view evidence"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id IN ('t2m-evidence', 'maintenance'));

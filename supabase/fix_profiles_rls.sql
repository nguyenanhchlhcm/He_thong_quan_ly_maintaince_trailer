-- Migration: Fix RLS Policy for profiles table
-- Date: 2026-05-17
-- Issue: Admin/Manager cannot fetch all employee profiles (useMasterData.ts:97)
-- Solution: Add policy allowing ADMIN/MANAGER to SELECT all profiles

-- Drop existing restrictive policy (optional - keep it for self-view)
-- We ADD a new policy instead of replacing

-- Policy: Admins and Managers can view ALL profiles
CREATE POLICY "Admins and Managers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('MANAGER', 'ADMIN')
  )
);

-- Also allow Admins/Managers to UPDATE profiles (for role changes, name edits)
CREATE POLICY "Admins and Managers can update profiles" 
ON public.profiles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('MANAGER', 'ADMIN')
  )
);

-- Allow authenticated users to INSERT their own profile (backup for auth trigger)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

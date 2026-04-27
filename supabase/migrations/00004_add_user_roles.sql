-- Migration to add app_role enum and role column to profiles

-- Create Enum for Roles
CREATE TYPE public.app_role AS ENUM (
  'superadmin',
  'admin',
  'sale',
  'user',
  'cto',
  'cfo',
  'ceo',
  'cio'
);

-- Add column using the new enum
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'user'::public.app_role NOT NULL;

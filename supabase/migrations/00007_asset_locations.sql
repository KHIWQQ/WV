-- Add country_code to assets table for geographical tracking
-- Using standard ISO 3166-1 alpha-2 codes (e.g., 'US', 'TH', 'JP')

ALTER TABLE public.assets 
ADD COLUMN country_code VARCHAR(2) DEFAULT 'TH';

-- Update existing records to 'TH' if they are null (though DEFAULT should handle it for new rows, this safeguards existing rows)
UPDATE public.assets 
SET country_code = 'TH' 
WHERE country_code IS NULL;

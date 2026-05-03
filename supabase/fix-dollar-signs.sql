-- Fix descriptions where dollar amounts were corrupted by the enrich-descriptions
-- script. The stripBlogMetadata function stripped 1–3 digit sequences to remove
-- blog metadata (e.g. "37 shares"), but also stripped digits from dollar amounts:
--   $37,000 → "$ ,"   (37 stripped, then 000 stripped)
--   $750 million → "$ million"  (750 stripped)
--
-- Run this once in the Supabase SQL editor.

UPDATE public.scholarships
SET description = trim(
  regexp_replace(
    -- Pass 1: remove "$ ," artifacts (from e.g. $37,000 → $ ,)
    regexp_replace(description, '\$\s*,\s*', ' ', 'g'),
    -- Pass 2: remove bare "$" before non-digit characters (e.g. "$ million" → "million")
    '\$([^0-9])',
    '\1',
    'g'
  )
)
WHERE description ~ '\$[^0-9]';

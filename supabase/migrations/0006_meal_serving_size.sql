-- Adds a serving-size field to meals, separate from the free-text
-- description, so the AI estimator and coach review have a clean quantity
-- to work from (e.g. description "grilled chicken breast", serving_size
-- "6 oz" rather than mixing the two into one string).
alter table meals add column if not exists serving_size text;

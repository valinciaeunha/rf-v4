-- Migration: Change qr_link and pay_url to TEXT to support long URLs
ALTER TABLE deposits ALTER COLUMN qr_link TYPE TEXT;
ALTER TABLE deposits ALTER COLUMN pay_url TYPE TEXT;

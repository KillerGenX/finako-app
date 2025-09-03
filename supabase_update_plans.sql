-- Supabase Subscription Plans Update
-- =================================================================
--
--  Tujuan: Menambahkan paket baru "Pro + AI" ke dalam katalog.
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

INSERT INTO public.subscription_plans (name, description, price, billing_interval, is_active)
VALUES
  ('Pro + AI', 'Unlock powerful AI features to automate your business.', 299000.00, 'month', true)
ON CONFLICT (name) DO NOTHING;

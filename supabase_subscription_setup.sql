-- Supabase Subscription Setup for Finako App (v2 - With Fix)
-- =================================================================
--
--  Tujuan: 
--  1. Memperbaiki skema tabel `subscription_plans` dengan menambahkan constraint UNIQUE.
--  2. Mengisi data awal untuk paket langganan.
--  3. Membuat fungsi database (RPC) untuk memulai masa percobaan (trial).
--
--  Instruksi: Salin dan jalankan seluruh skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- =================================================================
--  1. SCHEMA FIX: Add UNIQUE constraint to subscription_plans.name
-- =================================================================
-- Ini diperlukan agar klausa 'ON CONFLICT' dapat berfungsi dengan benar.
-- Menjalankan ini lebih dari sekali tidak akan menyebabkan error.
ALTER TABLE public.subscription_plans
ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);


-- =================================================================
--  2. SEED DATA: Masukkan data awal untuk Paket Langganan
-- =================================================================
-- Sekarang klausa ON CONFLICT akan berjalan dengan benar.
INSERT INTO public.subscription_plans (name, description, price, billing_interval, is_active)
VALUES
  ('Trial', '14-day free trial with access to all features.', 0.00, 'month', true),
  ('Pro', 'Full access for your growing business.', 149000.00, 'month', true)
ON CONFLICT (name) DO NOTHING;


-- =================================================================
--  3. FUNGSI (RPC): create_trial_subscription
-- =================================================================
-- Fungsi ini akan dipanggil oleh aplikasi (frontend) setelah pengguna berhasil mendaftar.
-- Tugasnya adalah membuat entri langganan percobaan untuk organisasi baru.
--
CREATE OR REPLACE FUNCTION public.create_trial_subscription(org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  trial_plan_id UUID;
BEGIN
  -- 1. Dapatkan ID dari paket 'Trial'
  SELECT id INTO trial_plan_id
  FROM public.subscription_plans
  WHERE name = 'Trial'
  LIMIT 1;

  -- 2. Jika paket 'Trial' tidak ditemukan, lemparkan error.
  IF trial_plan_id IS NULL THEN
    RAISE EXCEPTION 'Subscription plan "Trial" not found.';
  END IF;

  -- 3. Buat entri baru di tabel subscriptions.
  INSERT INTO public.subscriptions (
    organization_id,
    plan_id,
    status,
    current_period_start,
    current_period_end,
    trial_ends_at
  )
  VALUES (
    org_id,
    trial_plan_id,
    'trialing',
    now(),
    now() + interval '14 days',
    now() + interval '14 days'
  );
END;
$$;


-- =================================================================
-- Akhir dari skrip.
-- =================================================================

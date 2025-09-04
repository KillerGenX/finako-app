-- Supabase Admin Role Setup for Finako App
-- =================================================================
--
--  Tujuan: 
--  Menambahkan peran baru 'app_admin' ke dalam sistem untuk membedakan
--  antara admin aplikasi (Anda) dengan admin organisasi (pengguna biasa).
--
--  Instruksi: Jalankan skrip ini di SQL Editor Supabase Anda.
--
-- =================================================================

-- Menggunakan DO block untuk mencegah error jika nilai sudah ada
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'app_admin' AND enumtypid = 'user_role'::regtype) THEN
        ALTER TYPE public.user_role ADD VALUE 'app_admin';
    END IF;
END$$;

-- =================================================================
-- CATATAN PENTING SETELAH MENJALANKAN SKRIP INI:
-- =================================================================
-- 1. Buka Supabase Studio Anda.
-- 2. Pergi ke Table Editor.
-- 3. Buka tabel 'organization_members'.
-- 4. Cari baris yang sesuai dengan akun PENGGUNA ANDA.
-- 5. Ubah nilai di kolom 'role' untuk baris Anda menjadi 'app_admin'.
--
-- Ini akan memberikan akun Anda hak akses yang diperlukan untuk
-- mengakses panel admin yang akan kita bangun.
-- =================================================================

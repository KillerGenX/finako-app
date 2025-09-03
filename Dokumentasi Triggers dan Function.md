--  1. FUNGSI: handle_new_user
-- =================================================================
-- Fungsi ini akan dijalankan oleh trigger setiap kali ada user baru mendaftar.
-- Tugasnya adalah membuat 3 data penting secara atomik:
--    a. Sebuah 'organization' baru dimana user ini adalah pemiliknya.
--    b. Sebuah 'profile' publik untuk user ini.
--    c. Sebuah 'organization_member' yang menjadikan user ini 'admin' di organisasinya.
--
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
-- SECURITY DEFINER diperlukan agar fungsi ini memiliki hak akses untuk menulis ke tabel public.
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  -- Variabel untuk menampung ID organisasi yang baru dibuat.
  new_organization_id UUID;
BEGIN
  -- a. Membuat Organisasi baru untuk user.
  --    owner_id diisi dengan id user baru.
  --    Nama organisasi diambil dari metadata nama lengkap, jika ada.
  INSERT INTO public.organizations (owner_id, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'My') || '''s Organization'
  )
  -- Menyimpan id organisasi yang baru dibuat ke dalam variabel.
  RETURNING id INTO new_organization_id;

  -- b. Membuat Profil untuk user.
  --    ID profil sama dengan ID user untuk relasi 1-ke-1.
  --    Data diambil dari metadata user yang dikirim dari frontend saat sign up.
  INSERT INTO public.profiles (id, full_name, avatar_url, phone_number)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  );

  -- c. Menjadikan user sebagai admin di organisasinya sendiri.
  --    Menghubungkan user_id dengan organization_id yang baru dibuat.
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (
    new.id,
    new_organization_id,
    'admin'
  );
  
  RETURN new;
END;
$$;


-- =================================================================
--  2. TRIGGER: on_auth_user_created
-- =================================================================
-- Trigger ini akan memanggil fungsi handle_new_user() setiap kali
-- ada baris baru yang berhasil ditambahkan ke tabel auth.users.
--
-- DROP TRIGGER digunakan untuk memastikan kita bisa menjalankan skrip ini berulang kali
-- tanpa error jika trigger-nya sudah ada sebelumnya.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =================================================================
-- Akhir dari skrip.
-- =================================================================

-- Supabase Trigger Update for Finako App
-- =================================================================
--
--  Tujuan: 
--  Mengintegrasikan pembuatan langganan percobaan (trial) langsung ke dalam
--  alur pembuatan pengguna baru untuk menjadikannya proses yang sepenuhnya otomatis.
--
--  Instruksi: 
--  Salin dan jalankan seluruh skrip ini di SQL Editor Supabase Anda.
--  Ini akan menimpa (overwrite) fungsi handle_new_user yang lama dengan versi baru.
--
-- =================================================================


-- =================================================================
--  1. FUNGSI (UPDATED): handle_new_user
-- =================================================================
-- Versi baru dari fungsi ini sekarang juga memanggil create_trial_subscription.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  new_organization_id UUID;
BEGIN
  -- a. Membuat Organisasi baru untuk user.
  INSERT INTO public.organizations (owner_id, name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'My') || '''s Organization'
  )
  RETURNING id INTO new_organization_id;

  -- b. Membuat Profil untuk user.
  INSERT INTO public.profiles (id, full_name, avatar_url, phone_number)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.phone
  );

  -- c. Menjadikan user sebagai admin di organisasinya sendiri.
  INSERT INTO public.organization_members (user_id, organization_id, role)
  VALUES (
    new.id,
    new_organization_id,
    'admin'
  );
  
  -- d. (BARU) Memulai langganan percobaan untuk organisasi baru.
  --    Memanggil fungsi RPC yang sudah kita buat sebelumnya.
  --    'PERFORM' digunakan saat kita memanggil fungsi yang mengembalikan VOID.
  PERFORM public.create_trial_subscription(new_organization_id);

  RETURN new;
END;
$$;


-- =================================================================
-- Akhir dari skrip.
-- =================================================================

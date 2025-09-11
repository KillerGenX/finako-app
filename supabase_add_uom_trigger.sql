-- =================================================================
--  Trigger Otomatis untuk Satuan Ukur (Units of Measure) Default
-- =================================================================
--
--  Tujuan: 
--  Memastikan setiap organisasi baru secara otomatis mendapatkan
--  satuan ukur (UoM) default ('Unit' dan 'Pcs'). Ini memperbaiki bug
--  kritis di mana produk komposit tidak dapat dibuat oleh pengguna baru.
--
--  Komponen:
--  1.  Fungsi Trigger (`add_default_units_of_measure`):
--      - Fungsi ini berisi logika untuk menambahkan UoM default.
--      - Menggunakan variabel `NEW.id` untuk mendapatkan ID dari 
--        organisasi yang baru saja dibuat.
--  2.  Trigger (`on_new_organization_add_uom`):
--      - "Mendengarkan" setiap event INSERT di tabel `public.organizations`.
--      - Akan menjalankan fungsi trigger di atas secara otomatis setelah
--        sebuah organisasi berhasil dibuat.
--
--  Instruksi: 
--  Jalankan seluruh skrip ini di SQL Editor Supabase Anda. Ini adalah
--  pengaturan satu kali yang akan berlaku untuk semua pendaftaran
--  organisasi baru di masa mendatang.
--
-- =================================================================

-- 1. Buat Fungsi Trigger
CREATE OR REPLACE FUNCTION public.add_default_units_of_measure()
RETURNS TRIGGER AS $$
BEGIN
  -- Masukkan 'Unit' sebagai UoM default untuk organisasi baru
  INSERT INTO public.units_of_measure(organization_id, name, abbreviation)
  VALUES(NEW.id, 'Unit', 'unit');

  -- Masukkan 'Pcs' sebagai UoM default untuk organisasi baru
  INSERT INTO public.units_of_measure(organization_id, name, abbreviation)
  VALUES(NEW.id, 'Pcs', 'pcs');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Buat Trigger yang akan Menjalankan Fungsi di atas
-- DROP TRIGGER IF EXISTS on_new_organization_add_uom ON public.organizations; -- Uncomment jika Anda perlu menjalankan ulang
CREATE TRIGGER on_new_organization_add_uom
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.add_default_units_of_measure();

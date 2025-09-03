"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
  // ▼▼▼ PERBAIKAN UTAMA ADA DI SINI ▼▼▼
  // Menambahkan 'await' karena cookies() sekarang bersifat asynchronous.
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error logging out:', error);
    // Optionally handle error, e.g., show a toast notification
  }

  return redirect('/');
}

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          request.cookies.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          request.cookies.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const authPages = ['/', '/register'];

  // =================================================================
  // 1. TANGANI PENGGUNA YANG BELUM LOGIN
  // =================================================================
  if (!user) {
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return response; // Izinkan akses ke halaman publik
  }

  // =================================================================
  // 2. JIKA SUDAH LOGIN, DAPATKAN PERAN (ROLE) PENGGUNA
  // =================================================================
  const { data: member } = await supabase
    .from('organization_members')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .single();
  const userRole = member?.role;

  // =================================================================
  // 3. TERAPKAN ATURAN BERDASARKAN PERAN
  // =================================================================

  // ATURAN UNTUK ADMIN APLIKASI
  if (userRole === 'app_admin') {
    // Jika admin berada di halaman login/register, arahkan ke dashboard admin
    if (authPages.includes(pathname)) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    // Jika admin mencoba akses dashboard pengguna, arahkan kembali ke dashboard admin
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
    // Jika tidak, izinkan akses ke rute /admin
    return response;
  }
  
  // ATURAN UNTUK PENGGUNA BIASA (bukan app_admin)
  // Lindungi rute /admin dari pengguna biasa
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Arahkan dari halaman login/register ke dashboard pengguna
  if (authPages.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Terapkan aturan verifikasi email dan langganan
  if (!user.email_confirmed_at && !pathname.startsWith('/auth/confirm')) {
    return NextResponse.redirect(new URL('/auth/confirm', request.url));
  }

  if (user.email_confirmed_at && member) {
    const { data: subscription } = await supabase.from('subscriptions').select('status').eq('organization_id', member.organization_id).single();
    const isSubscribed = subscription && (subscription.status === 'active' || subscription.status === 'trialing');
    
    if (!isSubscribed && !pathname.startsWith('/dashboard/billing')) {
      return NextResponse.redirect(new URL('/dashboard/billing', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|finako.svg).*)',
  ],
}

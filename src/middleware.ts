import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
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
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove: (name, options) => {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const confirmUrl = new URL('/auth/confirm', request.url);

  // Jika tidak ada user (session) dan mencoba akses dashboard
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // ▼▼▼ PERUBAHAN UTAMA ADA DI SINI ▼▼▼
  // Jika ada user (session), TAPI emailnya belum dikonfirmasi
  if (user && !user.email_confirmed_at && !pathname.startsWith('/auth/confirm')) {
    // Arahkan ke halaman konfirmasi
    return NextResponse.redirect(confirmUrl);
  }

  // Jika user sudah login dan terverifikasi, dan mencoba akses halaman login/register
  if (user && user.email_confirmed_at && (pathname === '/' || pathname === '/register' || pathname.startsWith('/auth/confirm'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|finako.svg).*)',
  ],
}

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

  // Jika tidak ada user, arahkan ke login jika mencoba akses dashboard
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Jika ada user, lakukan pengecekan lebih lanjut
  if (user) {
    // 1. Cek Verifikasi Email
    if (!user.email_confirmed_at && !pathname.startsWith('/auth/confirm')) {
      return NextResponse.redirect(new URL('/auth/confirm', request.url));
    }
    
    // 2. Jika email sudah terverifikasi, cek status langganan
    if (user.email_confirmed_at) {
      // Ambil data langganan
      const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
      if (member) {
        const { data: subscription } = await supabase.from('subscriptions').select('status').eq('organization_id', member.organization_id).single();
        
        const isSubscribed = subscription && (subscription.status === 'active' || subscription.status === 'trialing');
        
        // ▼▼▼ LOGIKA PENGUNCIAN UTAMA ▼▼▼
        if (!isSubscribed && !pathname.startsWith('/dashboard/billing')) {
          return NextResponse.redirect(new URL('/dashboard/billing', request.url));
        }

        // Jika sudah berlangganan dan mencoba akses halaman auth, arahkan ke dashboard
        if (isSubscribed && (pathname === '/' || pathname === '/register' || pathname.startsWith('/auth'))) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|finako.svg).*)',
  ],
}

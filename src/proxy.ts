import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/login', '/force-logout', '/api', '/_next'];

// Role-based allowed paths
const allowedPaths = {
  SUPERADMIN: ['/dashboard', '/dashboard/jurusan', '/dashboard/admin-jurusan', '/dashboard/kriteria', '/dashboard/siswa'],
  ADMIN_JURUSAN: ['/dashboard/admin', '/dashboard/admin/aspek', '/dashboard/admin/penilai', '/dashboard/admin/laporan'],
  PENILAI: ['/dashboard/penilai', '/dashboard/penilai/penilaian'],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log('=== PROXY CALLED ===');
  console.log('Pathname:', pathname);
  console.log('Method:', request.method);
  console.log('URL:', request.url);

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('✓ Public path, allowing');
    return NextResponse.next();
  }

  // Get user cookie
  const userCookie = request.cookies.get('user');
  console.log('🔑 User cookie exists:', !!userCookie);
  
  if (userCookie) {
    console.log('🍪 User cookie value:', userCookie.value);
  }

  // If no user cookie, redirect to login
  if (!userCookie) {
    console.log('❌ No user cookie, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Parse user data from cookie
  let userData;
  try {
    userData = JSON.parse(userCookie.value);
    console.log('✅ User data parsed:', { role: userData.role, email: userData.email, name: userData.name });
  } catch (e) {
    console.log('❌ Invalid cookie, redirecting to login', e);
    // Invalid cookie, redirect to login
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if user role is defined
  if (!userData.role) {
    console.log('❌ No role in user data, redirecting to login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Get allowed paths for this role
  const roleAllowedPaths = allowedPaths[userData.role as keyof typeof allowedPaths];
  console.log('📋 User role:', userData.role);
  console.log('📋 Allowed paths for role:', roleAllowedPaths);

  // Check if current path is allowed for this role
  const isPathAllowed = roleAllowedPaths?.some(path => pathname === path || pathname.startsWith(path + '/'));
  console.log('🔍 Path allowed for this role:', isPathAllowed);

  if (!isPathAllowed) {
    console.log('❌ Path not allowed, redirecting to correct dashboard');
    // Path not allowed for this role, redirect to correct dashboard
    let targetPath = '/dashboard';
    switch (userData.role) {
      case 'SUPERADMIN':
        targetPath = '/dashboard';
        console.log('📌 SUPERADMIN → redirecting to /dashboard');
        break;
      case 'ADMIN_JURUSAN':
        targetPath = '/dashboard/admin';
        console.log('📌 ADMIN_JURUSAN → redirecting to /dashboard/admin');
        break;
      case 'PENILAI':
        targetPath = '/dashboard/penilai';
        console.log('📌 PENILAI → redirecting to /dashboard/penilai');
        break;
    }
    const dashboardUrl = new URL(targetPath, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // If on root, redirect to correct dashboard
  if (pathname === '/') {
    console.log('📍 On root, redirecting to dashboard based on role');
    let targetPath = '/dashboard';
    switch (userData.role) {
      case 'SUPERADMIN':
        targetPath = '/dashboard';
        break;
      case 'ADMIN_JURUSAN':
        targetPath = '/dashboard/admin';
        break;
      case 'PENILAI':
        targetPath = '/dashboard/penilai';
        break;
    }
    console.log('📌 Root → redirecting to:', targetPath);
    const dashboardUrl = new URL(targetPath, request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  console.log('✅ Path allowed, proceeding to:', pathname);
  // Allow dashboard paths
  return NextResponse.next();
}

export const config = {
  /*
   * Match all request paths except:
   * - api routes
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder
   */
  matcher: '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
};

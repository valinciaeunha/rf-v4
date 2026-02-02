import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Routes that require authentication
const protectedRoutes = [
    '/dashboard',
    '/billing',
    '/checkout',
    '/history',
    '/payment',
    '/products',
    '/profile',
    '/support',
    '/admin',
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ['/login', '/register'];

// SECURITY: Session secret validation
// Note: In middleware, we can't throw during module init as it breaks Next.js
// Instead, we validate at runtime and reject all sessions if secret is invalid
const rawSecret = process.env.SESSION_SECRET;
const SESSION_SECRET = rawSecret && rawSecret.length >= 32
    ? new TextEncoder().encode(rawSecret)
    : null;

async function verifySession(token: string): Promise<boolean> {
    // SECURITY: If secret not configured, reject ALL sessions
    if (!SESSION_SECRET) {
        console.error('SECURITY CRITICAL: SESSION_SECRET not configured or too short!');
        return false;
    }
    try {
        await jwtVerify(token, SESSION_SECRET);
        return true;
    } catch {
        return false;
    }
}

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    const token = request.cookies.get('session')?.value;

    // Check if current path is protected
    const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
    // Check if current path is auth route (login/register)
    const isAuthRoute = authRoutes.some(route => path.startsWith(route));

    // Verify session if token exists
    const isValidSession = token ? await verifySession(token) : false;

    // Redirect to login if accessing protected route without valid session
    if (isProtectedRoute && !isValidSession) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', path);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect to dashboard if accessing auth routes with valid session
    if (isAuthRoute && isValidSession) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt
         * - public folder files
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
    ],
};

import { NextResponse } from 'next/server'

export async function middleware(request) {
  // For now, we'll skip middleware logging and handle it client-side
  // This avoids Edge Runtime compatibility issues with SQLite
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes - we'll log these separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Rewrite /_surprise to /_surprise/index.html to serve the static file
    // instead of falling through to dynamic routes like [username]
    if (request.nextUrl.pathname === '/_surprise') {
        return NextResponse.rewrite(new URL('/_surprise/index.html', request.url))
    }
}

export const config = {
    matcher: '/_surprise',
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    // Get request cookies and headers, get a token from either and use jwt to check validity
    const token = request.cookies.get('token')?.value || request.headers.get('Authorization')

    if (!token) {
        return NextResponse.json({ code: "NO_TOKEN", message: "No token provided" })
    }

    // If token is invalid, return an error
    const resBody = await fetch(new URL(`/api/admins/login?token=${token}`, request.url).toString()).then((res) => res.json());
    if (resBody.code !== "OK") {
        return NextResponse.json({ code: "INVALID_TOKEN", message: "Invalid token" })
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        '/api/((?!admins/login).*)'
    ]
}
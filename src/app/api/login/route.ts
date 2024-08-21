import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { compareSync, hashSync } from "bcrypt";
import { sign, verify } from "jsonwebtoken";
import { JWT_SECRET } from "@/configs";

const prisma = new PrismaClient()

interface TokenInfo {
    adminId: number
}

export async function POST(req: NextRequest) {
    const { username, password } = await req.json()

    console.log({ username, password })

    // Get user
    const admin = await prisma.admin.findUnique({
        where: {
            username: username
        }
    })

    if (!admin) {
        // Admin Creation
        const admin = await prisma.admin.create({
            data: {
                username: username,
                password: hashSync(password, 10)
            }
        })
        return NextResponse.json({ code: "INCORRECT_USER", message: "Incorrect Username or Password" })
    }

    // Validata Password
    if (!compareSync(password, admin.password)) {
        return NextResponse.json({ code: "INCORRECT_PASSWORD", message: "Incorrect Username or Password" })
    }

    const tokenPayload: TokenInfo = { adminId: admin.id }
    const jwtToken = sign(tokenPayload, JWT_SECRET, { expiresIn: "1d" })

    return NextResponse.json({ code: "OK", message: "Login Successful", data: jwtToken });
}


export async function GET(req: NextRequest) {
    const params = req.nextUrl.searchParams
    const token = params.get("token")

    if (!token) {
        return NextResponse.json({ code: "NO_TOKEN", message: "No token in the request query" });
    }

    // Verify Token
    let tokenInfo: TokenInfo
    try {
        tokenInfo = verify(token, JWT_SECRET) as TokenInfo
    } catch (error) {
        return NextResponse.json({ code: "INVALID_TOKEN", message: "Invalid Token" });
    }

    // Get user
    const admin = await prisma.admin.findUnique({
        where: {
            id: tokenInfo.adminId
        }
    })

    if (!admin) {
        return NextResponse.json({ code: "INVALID_TOKEN", message: "Invalid Token" });
    }

    return NextResponse.json({ code: "OK", message: "Token is valid", data: admin });
}

// PUT to Create a new user
export async function PUT(req: NextRequest) {
    const { username, password } = await req.json()

    const existingAdmin = await prisma.admin.findUnique({
        where: {
            username: username
        }
    })

    if (existingAdmin) {
        return NextResponse.json({ code: "USER_EXISTS", message: "User already exists" });
    }

    // Create user
    const admin = await prisma.admin.create({
        data: {
            username,
            password: hashSync(password, 10)
        }
    })

    return NextResponse.json({ code: "OK", message: "User created", data: existingAdmin });
}

// PATCH to Change password
export async function PATCH(req: NextRequest) {
    const { username, password } = await req.json()

    // Get user
    const admin = await prisma.admin.findUnique({
        where: {
            username: username
        }
    })

    if (!admin) {
        return NextResponse.json({ code: "USER_NOT_FOUND", message: "User not found" });
    }

    // Update user
    const updatedAdmin = await prisma.admin.update({
        where: {
            id: admin.id
        },
        data: {
            password: hashSync(password, 10)
        }
    })

    return NextResponse.json({ code: "OK", message: "Password updated", data: updatedAdmin });
}
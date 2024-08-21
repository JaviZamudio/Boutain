import { execSync } from "child_process";
import { NextRequest, NextResponse } from "next/server";

export function GET(req: NextRequest) {
    req.headers.get("Authorization")

    const status = {
        docker: true
    }

    try {
        execSync("docker --version")
    } catch (error) {
        status.docker = false
    }

    return NextResponse.json({
        code: "OK",
        message: "Status gotten",
        data: status
    })
}
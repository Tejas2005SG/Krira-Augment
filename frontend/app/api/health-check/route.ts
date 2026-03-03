import { NextResponse } from "next/server";

export async function GET() {
    const nodeUrl = process.env.NEXT_PUBLIC_NODEJS_URL || "http://localhost:5000";
    const pythonUrl = process.env.NEXT_PUBLIC_PYTHON_URL || "http://localhost:8000";

    try {
        const [nodeRes, pythonRes] = await Promise.all([
            fetch(`${nodeUrl}/health`, { cache: "no-store" }).catch(() => null),
            fetch(`${pythonUrl}/health`, { cache: "no-store" }).catch(() => null),
        ]);

        const nodeOk = nodeRes?.ok ?? false;
        const pythonOk = pythonRes?.ok ?? false;

        return NextResponse.json({
            ready: nodeOk && pythonOk,
            services: {
                nodejs: nodeOk ? "healthy" : "unavailable",
                python: pythonOk ? "healthy" : "unavailable",
            },
        }, { status: nodeOk && pythonOk ? 200 : 503 });
    } catch {
        return NextResponse.json({
            ready: false,
            services: { nodejs: "unavailable", python: "unavailable" },
        }, { status: 503 });
    }
}

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000/api"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pipelineId, message, sessionId } = body

    if (!pipelineId || !message) {
      return NextResponse.json(
        { error: "pipelineId and message are required" },
        { status: 400 }
      )
    }

    // Get the auth token from cookies
    const cookieStore = await cookies()
    const accessToken = cookieStore.get("accessToken")?.value

    if (!accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Call the backend playground API (BACKEND_URL already includes /api)
    const response = await fetch(`${BACKEND_URL}/playground/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        pipelineId,
        message,
        sessionId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorData.message || "Failed to get response from chatbot" },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Playground chat error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

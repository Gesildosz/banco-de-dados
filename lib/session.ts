import { cookies } from "next/headers"

interface SessionData {
  userId: string
  userType: "admin" | "collaborator"
  role?: string // Optional role for more granular control
  pendingAccessCode?: boolean // For collaborator first login flow
}

export async function setSession(sessionData: SessionData) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  cookies().set("session", JSON.stringify(sessionData), {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/", // Ensure cookie is accessible across all paths
    sameSite: "lax",
  })
}

export async function getSession(): Promise<SessionData | null> {
  const session = cookies().get("session")?.value
  if (!session) {
    return null
  }
  try {
    return JSON.parse(session) as SessionData
  } catch (error) {
    console.error("Failed to parse session cookie:", error)
    return null
  }
}

export async function deleteSession() {
  cookies().delete("session")
}

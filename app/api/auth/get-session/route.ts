import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()
    if (session) {
      return NextResponse.json({ session }, { status: 200 })
    } else {
      return NextResponse.json({ session: null, error: "Nenhuma sessão ativa." }, { status: 401 })
    }
  } catch (error) {
    console.error("Erro ao obter sessão:", error)
    return NextResponse.json({ session: null, error: "Erro interno do servidor ao obter sessão." }, { status: 500 })
  }
}

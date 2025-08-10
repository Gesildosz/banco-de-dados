import { NextResponse } from "next/server"
import { getSession, setSession } from "@/lib/session"

export async function POST() {
  try {
    const session = await getSession()
    if (session && session.pendingAccessCode) {
      // Remove pendingAccessCode flag and re-set session
      const { pendingAccessCode, ...rest } = session
      await setSession(rest)
      return NextResponse.json({ message: "Sessão atualizada." }, { status: 200 })
    }
    return NextResponse.json({ message: "Nenhuma sessão pendente para limpar." }, { status: 200 })
  } catch (error) {
    console.error("Erro ao limpar pendingAccessCode da sessão:", error)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

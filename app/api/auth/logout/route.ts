import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    cookies().delete("session")
    return NextResponse.json({ message: "Logout bem-sucedido." }, { status: 200 })
  } catch (error) {
    console.error("Erro ao fazer logout:", error)
    return NextResponse.json({ error: "Falha ao fazer logout." }, { status: 500 })
  }
}

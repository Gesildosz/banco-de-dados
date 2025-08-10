import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import bcrypt from "bcryptjs"
import { setSession } from "@/lib/session"

export async function POST(request: Request) {
  const { username, password } = await request.json()
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("administrators")
      .select("id, password_hash")
      .eq("username", username)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 })
    }

    const passwordMatch = await bcrypt.compare(password, data.password_hash)

    if (!passwordMatch) {
      return NextResponse.json({ error: "Usuário ou senha inválidos." }, { status: 401 })
    }

    // Set session for admin
    await setSession({ userId: data.id, userType: "admin", role: "admin" })
    return NextResponse.json({ message: "Login bem-sucedido." }, { status: 200 })
  } catch (error: any) {
    console.error("Erro ao fazer login do administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

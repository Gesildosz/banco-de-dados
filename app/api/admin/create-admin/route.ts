import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const {
    full_name,
    username,
    password,
    can_create_collaborator,
    can_create_admin,
    can_enter_hours,
    can_change_access_code,
  } = await request.json()
  const supabase = createServerClient()

  // Check if the current admin has permission to create other admins
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para criar administradores." }, { status: 403 })
  }

  if (!full_name || !username || !password) {
    return NextResponse.json({ error: "Nome completo, usuário e senha são obrigatórios." }, { status: 400 })
  }

  try {
    const password_hash = await bcrypt.hash(password, 10)

    const { data, error } = await supabase.from("administrators").insert([
      {
        full_name,
        username,
        password_hash,
        can_create_collaborator: can_create_collaborator ?? false,
        can_create_admin: can_create_admin ?? false,
        can_enter_hours: can_enter_hours ?? false,
        can_change_access_code: can_change_access_code ?? false,
      },
    ])

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Nome de usuário já existe."
            : "Falha ao criar administrador.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Administrador criado com sucesso.", admin: data })
  } catch (error: any) {
    console.error("Erro ao criar administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

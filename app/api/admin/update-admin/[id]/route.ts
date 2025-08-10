import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"
import bcrypt from "bcryptjs"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const adminIdToUpdate = params.id
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

  // Check if the current admin has permission to create/manage other admins
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para atualizar administradores." }, { status: 403 })
  }

  try {
    let password_hash = undefined
    if (password) {
      password_hash = await bcrypt.hash(password, 10)
    }

    const updateData: { [key: string]: any } = {
      full_name,
      username,
      can_create_collaborator,
      can_create_admin,
      can_enter_hours,
      can_change_access_code,
    }

    if (password_hash) {
      updateData.password_hash = password_hash
    }

    const { error } = await supabase.from("administrators").update(updateData).eq("id", adminIdToUpdate)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Administrador atualizado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao atualizar administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

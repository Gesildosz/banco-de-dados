import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const adminId = searchParams.get("id")

  if (!adminId) {
    return NextResponse.json({ error: "ID do administrador é obrigatório." }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    const { data: admin, error } = await supabase
      .from("administrators")
      .select(
        "id, full_name, username, can_create_collaborator, can_create_admin, can_enter_hours, can_change_access_code",
      )
      .eq("id", adminId)
      .single()

    if (error || !admin) {
      return NextResponse.json({ error: "Administrador não encontrado." }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error: any) {
    console.error("Erro ao buscar dados do administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

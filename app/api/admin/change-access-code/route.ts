import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { collaboratorId, newAccessCode } = await request.json()
  const supabase = createServerClient()

  // Check admin permission
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_change_access_code")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_change_access_code) {
    return NextResponse.json({ error: "Você não tem permissão para alterar códigos de acesso." }, { status: 403 })
  }

  if (!collaboratorId || !newAccessCode) {
    return NextResponse.json({ error: "ID do colaborador e novo código de acesso são obrigatórios." }, { status: 400 })
  }

  try {
    // Check if the new access code already exists
    const { data: existingCollaborator, error: existingError } = await supabase
      .from("collaborators")
      .select("id")
      .eq("access_code", newAccessCode)
      .single()

    if (existingCollaborator && existingCollaborator.id !== collaboratorId) {
      return NextResponse.json(
        { error: "Este código de acesso já está em uso por outro colaborador." },
        { status: 409 },
      )
    }

    const { error } = await supabase
      .from("collaborators")
      .update({ access_code: newAccessCode })
      .eq("id", collaboratorId)

    if (error) {
      console.error("Erro ao atualizar código de acesso:", error.message)
      return NextResponse.json({ error: "Falha ao alterar o código de acesso." }, { status: 500 })
    }

    return NextResponse.json({ message: "Código de acesso alterado com sucesso." })
  } catch (error: any) {
    console.error("Erro interno do servidor ao alterar código de acesso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

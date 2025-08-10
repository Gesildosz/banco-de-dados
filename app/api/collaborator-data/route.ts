import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: collaborator, error } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, balance_hours, direct_leader")
      .eq("id", session.userId)
      .single()

    if (error || !collaborator) {
      return NextResponse.json({ error: "Dados do colaborador não encontrados." }, { status: 404 })
    }

    return NextResponse.json(collaborator)
  } catch (error: any) {
    console.error("Erro ao buscar dados do colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

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
    const { data: timeEntries, error } = await supabase
      .from("time_entries")
      .select("*")
      .eq("collaborator_id", session.userId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false }) // Secondary sort for entries on the same day

    if (error) {
      console.error("Erro ao buscar histórico de horas do colaborador:", error.message)
      return NextResponse.json({ error: "Falha ao carregar histórico de horas." }, { status: 500 })
    }

    return NextResponse.json({ timeEntries })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar histórico de horas do colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

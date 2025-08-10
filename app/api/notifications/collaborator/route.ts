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
    const { data: notifications, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", session.userId)
      .eq("user_type", "collaborator")
      .order("created_at", { ascending: false })
      .limit(10) // Fetch latest 10 notifications

    if (error) {
      console.error("Erro ao buscar notificações do colaborador:", error.message)
      return NextResponse.json({ error: "Falha ao carregar notificações." }, { status: 500 })
    }

    return NextResponse.json({ notifications })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar notificações do colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

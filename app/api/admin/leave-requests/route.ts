import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: leaveRequests, error } = await supabase
      .from("leave_requests")
      .select("*, collaborators(full_name, badge_number)") // Fetch collaborator details
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Erro ao buscar solicitações de folga para administradores:", error.message)
      return NextResponse.json({ error: "Falha ao carregar solicitações de folga." }, { status: 500 })
    }

    return NextResponse.json({ leaveRequests })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar solicitações de folga para administradores:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

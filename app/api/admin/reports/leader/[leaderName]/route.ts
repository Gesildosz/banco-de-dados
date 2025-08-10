import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET(request: Request, { params }: { params: { leaderName: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const leaderName = decodeURIComponent(params.leaderName)
  const supabase = createServerClient()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerar relatórios." }, { status: 403 })
  }

  try {
    const { data: collaborators, error: collabError } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, balance_hours")
      .eq("direct_leader", leaderName)
      .order("full_name", { ascending: true })

    if (collabError) {
      console.error(`Erro ao buscar colaboradores para o líder ${leaderName}:`, collabError.message)
      return NextResponse.json({ error: "Falha ao carregar dados dos colaboradores." }, { status: 500 })
    }

    let totalPositiveHours = 0
    let totalNegativeHours = 0

    collaborators?.forEach((collab) => {
      if (collab.balance_hours > 0) {
        totalPositiveHours += collab.balance_hours
      } else {
        totalNegativeHours += collab.balance_hours
      }
    })

    return NextResponse.json({
      leaderName,
      collaborators: collaborators || [],
      totalPositiveHours,
      totalNegativeHours,
    })
  } catch (error: any) {
    console.error("Erro interno do servidor ao gerar relatório por líder:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

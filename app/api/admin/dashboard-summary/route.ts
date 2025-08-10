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
    // Fetch total positive and negative hours
    const { data: totalHoursData, error: totalHoursError } = await supabase.rpc("get_total_positive_negative_hours")

    if (totalHoursError) {
      console.error("Erro ao buscar totais de horas:", totalHoursError.message)
      return NextResponse.json({ error: "Falha ao carregar resumo de horas." }, { status: 500 })
    }

    const totalPositiveHours = totalHoursData?.[0]?.total_positive_hours || 0
    const totalNegativeHours = totalHoursData?.[0]?.total_negative_hours || 0

    // Fetch collaborators with positive balance
    const { data: positiveCollaborators, error: positiveError } = await supabase
      .from("collaborators")
      .select("full_name, badge_number, balance_hours")
      .gt("balance_hours", 0)
      .order("balance_hours", { ascending: false })
      .limit(5) // Limit to top 5

    if (positiveError) {
      console.error("Erro ao buscar colaboradores com saldo positivo:", positiveError.message)
      return NextResponse.json({ error: "Falha ao carregar colaboradores com saldo positivo." }, { status: 500 })
    }

    // Fetch collaborators with negative balance
    const { data: negativeCollaborators, error: negativeError } = await supabase
      .from("collaborators")
      .select("full_name, badge_number, balance_hours")
      .lt("balance_hours", 0)
      .order("balance_hours", { ascending: true }) // Order by most negative first
      .limit(5) // Limit to top 5

    if (negativeError) {
      console.error("Erro ao buscar colaboradores com saldo negativo:", negativeError.message)
      return NextResponse.json({ error: "Falha ao carregar colaboradores com saldo negativo." }, { status: 500 })
    }

    return NextResponse.json({
      totalPositiveHours,
      totalNegativeHours,
      positiveCollaborators: positiveCollaborators || [],
      negativeCollaborators: negativeCollaborators || [],
    })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar resumo do dashboard:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

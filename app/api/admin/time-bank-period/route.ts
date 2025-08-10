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
    const { data: period, error } = await supabase
      .from("time_bank_periods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      console.error("Erro ao buscar período do banco de horas:", error.message)
      return NextResponse.json({ error: "Falha ao carregar período do banco de horas." }, { status: 500 })
    }

    return NextResponse.json(period || null)
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar período do banco de horas:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { start_date, end_date } = await request.json()
  const supabase = createServerClient()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json(
      { error: "Você não tem permissão para gerenciar o período do banco de horas." },
      { status: 403 },
    )
  }

  if (!start_date || !end_date) {
    return NextResponse.json({ error: "Data de início e data de término são obrigatórias." }, { status: 400 })
  }

  if (new Date(start_date) >= new Date(end_date)) {
    return NextResponse.json({ error: "A data de início deve ser anterior à data de término." }, { status: 400 })
  }

  try {
    // Deactivate any currently active periods
    await supabase.from("time_bank_periods").update({ is_active: false }).eq("is_active", true)

    const { data, error } = await supabase.from("time_bank_periods").insert([
      {
        start_date,
        end_date,
        is_active: true,
        admin_id: session.userId,
      },
    ])

    if (error) {
      console.error("Erro ao criar período do banco de horas:", error.message)
      return NextResponse.json({ error: "Falha ao criar período do banco de horas." }, { status: 500 })
    }

    return NextResponse.json({ message: "Período do banco de horas definido com sucesso.", period: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao definir período do banco de horas:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.userType !== "collaborator") {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from("time_bank_periods")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code === "PGRST116") {
      // No rows found (no active period)
      return NextResponse.json({ message: "Nenhum período de banco de horas ativo encontrado." }, { status: 200 })
    }

    if (error) {
      console.error("Erro ao buscar período do banco de horas:", error)
      return NextResponse.json({ error: "Erro ao buscar período do banco de horas." }, { status: 500 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error("Erro inesperado na rota time-bank-period:", error)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

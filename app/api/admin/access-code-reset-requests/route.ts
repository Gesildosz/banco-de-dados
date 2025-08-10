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
    const { data: requests, error } = await supabase
      .from("access_code_reset_requests")
      .select("*, collaborators(full_name, badge_number, access_code)")
      .order("requested_at", { ascending: false })

    if (error) {
      console.error(
        "Erro ao buscar solicitações de redefinição de código de acesso para administradores:",
        error.message,
      )
      return NextResponse.json(
        { error: "Falha ao carregar solicitações de redefinição de código de acesso." },
        { status: 500 },
      )
    }

    return NextResponse.json({ requests })
  } catch (error: any) {
    console.error(
      "Erro interno do servidor ao buscar solicitações de redefinição de código de acesso para administradores:",
      error.message,
    )
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

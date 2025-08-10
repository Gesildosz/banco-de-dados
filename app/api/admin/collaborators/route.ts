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
    const { data: collaborators, error } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, access_code, direct_leader, balance_hours")
      .order("full_name", { ascending: true })

    if (error) {
      console.error("Erro ao buscar colaboradores:", error.message)
      return NextResponse.json({ error: "Falha ao carregar colaboradores." }, { status: 500 })
    }

    return NextResponse.json(collaborators)
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar colaboradores:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { full_name, badge_number, access_code, direct_leader } = await request.json()
  const supabase = createServerClient()

  // Check admin permission
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_collaborator")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_collaborator) {
    return NextResponse.json({ error: "Você não tem permissão para criar colaboradores." }, { status: 403 })
  }

  if (!full_name || !badge_number || !access_code) {
    return NextResponse.json(
      { error: "Nome completo, número do crachá e código de acesso são obrigatórios." },
      { status: 400 },
    )
  }

  try {
    const { data, error } = await supabase.from("collaborators").insert([
      {
        full_name,
        badge_number,
        access_code,
        direct_leader: direct_leader || null,
      },
    ])

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Número do crachá ou código de acesso já existe."
            : "Falha ao criar colaborador.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Colaborador criado com sucesso.", collaborator: data })
  } catch (error: any) {
    console.error("Erro ao criar colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

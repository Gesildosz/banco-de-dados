import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

const MAX_BANNERS = 5

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const bannerId = params.id
  const updates = await request.json()
  const supabase = createServerClient()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar banners." }, { status: 403 })
  }

  if (updates.order_index && (updates.order_index < 1 || updates.order_index > MAX_BANNERS)) {
    return NextResponse.json({ error: `A ordem deve ser entre 1 e ${MAX_BANNERS}.` }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from("info_banners")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", bannerId)

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Já existe um banner com esta ordem de exibição."
            : "Falha ao atualizar banner.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Banner atualizado com sucesso." })
  } catch (error: any) {
    console.error("Erro ao atualizar banner:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const bannerId = params.id
  const supabase = createServerClient()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar banners." }, { status: 403 })
  }

  try {
    const { error } = await supabase.from("info_banners").delete().eq("id", bannerId)

    if (error) {
      return NextResponse.json({ error: "Falha ao excluir banner." }, { status: 400 })
    }

    return NextResponse.json({ message: "Banner excluído com sucesso." })
  } catch (error: any) {
    console.error("Erro ao excluir banner:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

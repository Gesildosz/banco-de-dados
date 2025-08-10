import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

const MAX_BANNERS = 5

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: banners, error } = await supabase
      .from("info_banners")
      .select("id, image_url, link_url, order_index, is_active")
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Erro ao buscar banners informativos:", error.message)
      return NextResponse.json({ error: "Falha ao carregar banners informativos." }, { status: 500 })
    }

    return NextResponse.json({ banners })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar banners informativos:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()
  const { image_url, link_url, order_index, is_active } = await request.json()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar banners." }, { status: 403 })
  }

  if (!image_url || !order_index) {
    return NextResponse.json({ error: "URL da imagem e Ordem são obrigatórios." }, { status: 400 })
  }

  if (order_index < 1 || order_index > MAX_BANNERS) {
    return NextResponse.json({ error: `A ordem deve ser entre 1 e ${MAX_BANNERS}.` }, { status: 400 })
  }

  try {
    // Check current number of banners
    const { count, error: countError } = await supabase.from("info_banners").select("id", { count: "exact" })

    if (countError) {
      console.error("Erro ao contar banners existentes:", countError.message)
      return NextResponse.json({ error: "Falha ao verificar limite de banners." }, { status: 500 })
    }

    if (count && count >= MAX_BANNERS) {
      return NextResponse.json(
        { error: `Limite máximo de ${MAX_BANNERS} banners atingido. Edite um existente.` },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from("info_banners")
      .insert([
        {
          image_url,
          link_url: link_url || null,
          order_index,
          is_active: is_active ?? true,
          admin_id: session.userId,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("duplicate key")
            ? "Já existe um banner com esta ordem de exibição."
            : "Falha ao adicionar banner.",
        },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: "Banner adicionado com sucesso.", banner: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao adicionar banner:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

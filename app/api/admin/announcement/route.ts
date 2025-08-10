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
    // Fetch the latest announcement
    const { data: announcement, error } = await supabase
      .from("announcements")
      .select("content")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      console.error("Erro ao buscar aviso:", error.message)
      return NextResponse.json({ error: "Falha ao carregar aviso." }, { status: 500 })
    }

    return NextResponse.json({ content: announcement?.content || "" })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar aviso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { content } = await request.json()
  const supabase = createServerClient()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar avisos." }, { status: 403 })
  }

  if (!content) {
    return NextResponse.json({ error: "Conteúdo do aviso é obrigatório." }, { status: 400 })
  }

  try {
    // Delete existing announcements to keep only the latest
    const { error: deleteError } = await supabase
      .from("announcements")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all

    if (deleteError) {
      console.error("Erro ao limpar avisos antigos:", deleteError.message)
      // Continue even if old announcements fail to delete, as long as new one can be inserted
    }

    const { data, error } = await supabase.from("announcements").insert([
      {
        content,
        admin_id: session.userId,
      },
    ])

    if (error) {
      console.error("Erro ao salvar aviso:", error.message)
      return NextResponse.json({ error: "Falha ao salvar aviso." }, { status: 500 })
    }

    return NextResponse.json({ message: "Aviso salvo com sucesso.", announcement: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao salvar aviso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

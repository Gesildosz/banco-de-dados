import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    // Fetch the latest announcement
    const { data: announcement, error } = await supabase
      .from("announcements")
      .select("content, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 means no rows found, which is fine
      console.error("Erro ao buscar aviso para colaborador:", error.message)
      return NextResponse.json({ error: "Falha ao carregar aviso." }, { status: 500 })
    }

    return NextResponse.json({
      content: announcement?.content || "",
      created_at: announcement?.created_at || null,
    })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar aviso para colaborador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

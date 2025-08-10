import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    // Check if there's an existing pending request for this collaborator
    const { data: existingRequest, error: existingError } = await supabase
      .from("access_code_reset_requests")
      .select("id")
      .eq("collaborator_id", session.userId)
      .eq("status", "pending")
      .single()

    if (existingRequest) {
      return NextResponse.json(
        { error: "Você já tem uma solicitação de redefinição de código de acesso pendente." },
        { status: 409 },
      )
    }

    const { data, error } = await supabase.from("access_code_reset_requests").insert([
      {
        collaborator_id: session.userId,
        status: "pending",
      },
    ])

    if (error) {
      console.error("Erro ao criar solicitação de redefinição de código de acesso:", error.message)
      return NextResponse.json(
        { error: "Falha ao enviar solicitação de redefinição de código de acesso." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      message: "Solicitação de redefinição de código de acesso enviada com sucesso.",
      request: data,
    })
  } catch (error: any) {
    console.error("Erro interno do servidor ao enviar solicitação de redefinição de código de acesso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

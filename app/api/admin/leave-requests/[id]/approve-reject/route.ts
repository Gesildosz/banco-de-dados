import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const requestId = params.id
  const { status } = await request.json() // 'approved' or 'rejected'
  const supabase = createServerClient()

  // Check admin permission (reusing can_enter_hours as a proxy for now)
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para gerenciar solicitações de folga." }, { status: 403 })
  }

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from("leave_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .select()
      .single()

    if (error || !data) {
      console.error("Erro ao atualizar solicitação de folga:", error?.message || "Solicitação não encontrada.")
      return NextResponse.json({ error: "Falha ao atualizar solicitação de folga." }, { status: 500 })
    }

    // Optionally, send a notification to the collaborator
    await supabase.from("notifications").insert({
      user_id: data.collaborator_id,
      user_type: "collaborator",
      message: `Sua solicitação de folga de ${data.start_date} a ${data.end_date} foi ${status === "approved" ? "APROVADA" : "REJEITADA"}.`,
      type: "leave_request_status",
      related_id: data.id,
    })

    return NextResponse.json({ message: "Status da solicitação de folga atualizado com sucesso.", request: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao aprovar/rejeitar solicitação de folga:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

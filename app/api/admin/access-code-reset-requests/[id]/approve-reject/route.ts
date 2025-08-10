import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const requestId = params.id
  const { status, newAccessCode, notes } = await request.json() // 'approved' or 'rejected'
  const supabase = createServerClient()

  // Check admin permission
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_change_access_code")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_change_access_code) {
    return NextResponse.json(
      { error: "Você não tem permissão para gerenciar solicitações de redefinição de código de acesso." },
      { status: 403 },
    )
  }

  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 })
  }

  try {
    // Start a transaction if your Supabase client supports it, or handle atomicity carefully
    // For simplicity, doing sequential operations here.

    // Update the request status
    const { data: updatedRequest, error: updateRequestError } = await supabase
      .from("access_code_reset_requests")
      .update({
        status,
        processed_at: new Date().toISOString(),
        admin_id: session.userId,
        notes: notes || null,
      })
      .eq("id", requestId)
      .select()
      .single()

    if (updateRequestError || !updatedRequest) {
      console.error(
        "Erro ao atualizar solicitação de redefinição de código de acesso:",
        updateRequestError?.message || "Solicitação não encontrada.",
      )
      return NextResponse.json(
        { error: "Falha ao atualizar solicitação de redefinição de código de acesso." },
        { status: 500 },
      )
    }

    // If approved, update the collaborator's access code
    if (status === "approved") {
      if (!newAccessCode) {
        return NextResponse.json({ error: "Novo código de acesso é obrigatório para aprovação." }, { status: 400 })
      }

      // Check if the new access code is already in use by another collaborator
      const { data: existingCollab, error: existingCollabError } = await supabase
        .from("collaborators")
        .select("id")
        .eq("access_code", newAccessCode)
        .neq("id", updatedRequest.collaborator_id) // Exclude the current collaborator
        .single()

      if (existingCollabError && existingCollabError.code !== "PGRST116") {
        // PGRST116 means no rows found
        console.error("Erro ao verificar código de acesso existente:", existingCollabError.message)
        return NextResponse.json({ error: "Falha ao verificar código de acesso." }, { status: 500 })
      }

      if (existingCollab) {
        return NextResponse.json(
          { error: "Este código de acesso já está em uso por outro colaborador." },
          { status: 409 },
        )
      }

      const { error: updateCollaboratorError } = await supabase
        .from("collaborators")
        .update({ access_code: newAccessCode })
        .eq("id", updatedRequest.collaborator_id)

      if (updateCollaboratorError) {
        console.error("Erro ao atualizar código de acesso do colaborador:", updateCollaboratorError.message)
        // Potentially revert the request status if this fails, depending on desired atomicity
        return NextResponse.json({ error: "Falha ao atualizar código de acesso do colaborador." }, { status: 500 })
      }
    }

    // Send notification to the collaborator
    const notificationMessage =
      status === "approved"
        ? `Sua solicitação de redefinição de código de acesso foi APROVADA. Seu novo código é: ${newAccessCode}.`
        : `Sua solicitação de redefinição de código de acesso foi REJEITADA. Notas: ${notes || "N/A"}.`

    await supabase.from("notifications").insert({
      user_id: updatedRequest.collaborator_id,
      user_type: "collaborator",
      message: notificationMessage,
      type: "access_code_reset_status",
      related_id: updatedRequest.id,
    })

    return NextResponse.json({
      message: "Status da solicitação de redefinição de código de acesso atualizado com sucesso.",
    })
  } catch (error: any) {
    console.error(
      "Erro interno do servidor ao processar solicitação de redefinição de código de acesso:",
      error.message,
    )
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

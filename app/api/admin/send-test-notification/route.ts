import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { recipientId, recipientType, message } = await request.json()
  const supabase = createServerClient()

  // Basic permission check: only super admins (can_create_admin) can send test notifications
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para enviar notificações de teste." }, { status: 403 })
  }

  if (!recipientId || !recipientType || !message) {
    return NextResponse.json({ error: "ID do destinatário, tipo e mensagem são obrigatórios." }, { status: 400 })
  }

  if (!["collaborator", "admin"].includes(recipientType)) {
    return NextResponse.json({ error: "Tipo de destinatário inválido." }, { status: 400 })
  }

  try {
    // Verify recipient exists
    let userExists = false
    if (recipientType === "collaborator") {
      const { data, error } = await supabase.from("collaborators").select("id").eq("id", recipientId).single()
      if (data && !error) userExists = true
    } else if (recipientType === "admin") {
      const { data, error } = await supabase.from("administrators").select("id").eq("id", recipientId).single()
      if (data && !error) userExists = true
    }

    if (!userExists) {
      return NextResponse.json({ error: "Destinatário não encontrado." }, { status: 404 })
    }

    const { data, error } = await supabase.from("notifications").insert([
      {
        user_id: recipientId,
        user_type: recipientType,
        message,
        type: "test_notification",
        related_id: null, // No specific related ID for a generic test notification
      },
    ])

    if (error) {
      console.error("Erro ao enviar notificação de teste:", error.message)
      return NextResponse.json({ error: "Falha ao enviar notificação de teste." }, { status: 500 })
    }

    return NextResponse.json({ message: "Notificação de teste enviada com sucesso.", notification: data })
  } catch (error: any) {
    console.error("Erro interno do servidor ao enviar notificação de teste:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

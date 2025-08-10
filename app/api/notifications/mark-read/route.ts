import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { notificationIds } = await request.json()
  const supabase = createServerClient()

  if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
    return NextResponse.json({ error: "IDs de notificação inválidos." }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .in("id", notificationIds)
      .eq("user_id", session.userId) // Ensure user can only mark their own notifications as read
      .eq("user_type", session.role) // Ensure user can only mark their own notifications as read

    if (error) {
      console.error("Erro ao marcar notificações como lidas:", error.message)
      return NextResponse.json({ error: "Falha ao marcar notificações como lidas." }, { status: 500 })
    }

    return NextResponse.json({ message: "Notificações marcadas como lidas com sucesso." })
  } catch (error: any) {
    console.error("Erro interno do servidor ao marcar notificações como lidas:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

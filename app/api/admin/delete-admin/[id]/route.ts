import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const adminIdToDelete = params.id
  const supabase = createServerClient()

  // Check if the current admin has permission to create/manage other admins
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_create_admin")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_create_admin) {
    return NextResponse.json({ error: "Você não tem permissão para excluir administradores." }, { status: 403 })
  }

  // Prevent an admin from deleting themselves
  if (session.userId === adminIdToDelete) {
    return NextResponse.json({ error: "Você não pode excluir sua própria conta de administrador." }, { status: 400 })
  }

  try {
    const { error } = await supabase.from("administrators").delete().eq("id", adminIdToDelete)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ message: "Administrador excluído com sucesso." })
  } catch (error: any) {
    console.error("Erro ao excluir administrador:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

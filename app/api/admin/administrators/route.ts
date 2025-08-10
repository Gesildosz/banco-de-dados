import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function GET() {
  // NOVO LOG: Verifica se a rota da API está sendo acessada
  console.log("API Route: /api/admin/administrators GET request received.")

  const session = await getSession()
  if (!session || session.role !== "admin") {
    // LOG MODIFICADO: Mais detalhes sobre a falha de sessão
    console.log("API Route: /api/admin/administrators - Unauthorized session or not admin.")
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const supabase = createServerClient()

  try {
    const { data: administrators, error } = await supabase
      .from("administrators")
      .select(
        "id, full_name, username, can_create_collaborator, can_create_admin, can_enter_hours, can_change_access_code",
      )
      .order("full_name", { ascending: true })

    if (error) {
      // LOG MODIFICADO: Mais detalhes sobre o erro do Supabase
      console.error("API Route: /api/admin/administrators - Erro ao buscar administradores:", error.message)
      return NextResponse.json({ error: "Falha ao carregar administradores." }, { status: 500 })
    }

    // NOVO LOG: Confirma que os administradores foram buscados com sucesso
    console.log("API Route: /api/admin/administrators - Successfully fetched administrators.")
    return NextResponse.json(administrators)
  } catch (error: any) {
    // LOG MODIFICADO: Mais detalhes sobre erros internos
    console.error("API Route: /api/admin/administrators - Erro interno do servidor:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession, createSession } from "@/lib/session"

/**
 * Cadastra o código de acesso do colaborador pela primeira vez.
 * Regras:
 * - Requer sessão válida com role "collaborator".
 * - Idealmente a sessão terá pendingAccessCode: true (primeiro acesso).
 * - Atualiza somente se o colaborador AINDA não tem access_code definido.
 */
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "collaborator") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { accessCode, confirmAccessCode } = await request.json()

  if (!accessCode || !confirmAccessCode) {
    return NextResponse.json({ error: "Informe e confirme o código de acesso." }, { status: 400 })
  }

  if (accessCode !== confirmAccessCode) {
    return NextResponse.json({ error: "Os códigos informados não conferem." }, { status: 400 })
  }

  if (String(accessCode).trim().length < 4) {
    return NextResponse.json({ error: "O código de acesso deve ter pelo menos 4 caracteres." }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    // Garante que ainda não há código cadastrado
    const { data: current, error: fetchError } = await supabase
      .from("collaborators")
      .select("id, access_code")
      .eq("id", session.userId as string)
      .single()

    if (fetchError || !current) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 })
    }

    if (current.access_code) {
      return NextResponse.json({ error: "Você já possui um código de acesso cadastrado." }, { status: 409 })
    }

    const { error: updateError } = await supabase
      .from("collaborators")
      .update({ access_code: String(accessCode).trim() })
      .eq("id", session.userId as string)

    if (updateError) {
      console.error("Erro ao cadastrar código de acesso:", updateError.message)
      return NextResponse.json({ error: "Falha ao cadastrar código de acesso." }, { status: 500 })
    }

    // Recria a sessão sem a flag de cadastro pendente
    await createSession(session.userId as string, "collaborator")

    return NextResponse.json({ message: "Código de acesso cadastrado com sucesso." })
  } catch (err: any) {
    console.error("Erro interno no cadastro de código de acesso:", err?.message || err)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { setSession } from "@/lib/session"

export async function POST(request: Request) {
  let badgeNumber: string
  let accessCode: string | undefined

  try {
    const body = await request.json()
    badgeNumber = body.badgeNumber
    accessCode = body.accessCode
  } catch (parseError: any) {
    console.error("API: collaborator-login - Error parsing request body:", parseError.message)
    return NextResponse.json({ error: "Requisição inválida. Corpo da requisição não é JSON válido." }, { status: 400 })
  }

  if (!badgeNumber) {
    return NextResponse.json({ error: "Número do crachá é obrigatório." }, { status: 400 })
  }

  const supabase = createServerClient()

  try {
    const { data: collaborator, error: collabError } = await supabase
      .from("collaborators")
      .select("id, full_name, badge_number, access_code_set, is_active") // Removed access_code from select
      .eq("badge_number", badgeNumber)
      .single()

    if (collabError) {
      console.error("API: collaborator-login - Supabase query error:", collabError.message)
      return NextResponse.json({ error: "Erro ao verificar o crachá. Tente novamente." }, { status: 500 })
    }

    if (!collaborator || !collaborator.is_active) {
      return NextResponse.json({ error: "Número do crachá inválido ou colaborador inativo." }, { status: 401 })
    }

    // Scenario 1: Collaborator does NOT have an access code set in DB
    if (!collaborator.access_code_set) {
      if (accessCode) {
        return NextResponse.json(
          {
            error:
              "Você não possui um código de acesso cadastrado. Por favor, deixe o campo de código de acesso vazio para cadastrar um novo.",
          },
          { status: 400 },
        )
      }
      // Set a temporary session for setup-access-code page
      await setSession({ userId: collaborator.id, userType: "collaborator", pendingAccessCode: true })
      return NextResponse.json(
        {
          message: "Cadastro de código de acesso necessário.",
          needsAccessCodeSetup: true,
        },
        { status: 200 },
      )
    }

    // Scenario 2: Collaborator HAS an access code set in DB
    if (collaborator.access_code_set) {
      if (!accessCode) {
        return NextResponse.json(
          { error: "Código de acesso é obrigatório.", accessCodeRequired: true },
          { status: 200 },
        )
      }

      // Verify access code using Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: `${badgeNumber}@timebank.com`, // Using badge number as email for Supabase auth
        password: accessCode,
      })

      if (authError) {
        console.error("API: collaborator-login - Supabase Auth error:", authError.message)
        return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 })
      }
      if (!authData.session) {
        console.error("API: collaborator-login - Supabase Auth did not return a session.")
        return NextResponse.json({ error: "Falha na autenticação. Nenhuma sessão retornada." }, { status: 500 })
      }

      // Set session for authenticated user
      await setSession({ userId: collaborator.id, userType: "collaborator" })
      return NextResponse.json({ message: "Login de colaborador bem-sucedido." }, { status: 200 })
    }

    return NextResponse.json({ error: "Erro inesperado no login." }, { status: 500 })
  } catch (err: any) {
    console.error("API: collaborator-login - Uncaught error in POST handler:", err?.message || err)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

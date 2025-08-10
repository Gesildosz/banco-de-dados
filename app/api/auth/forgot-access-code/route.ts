import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  const { badgeNumber } = await request.json()
  const supabase = createServerClient()

  if (!badgeNumber) {
    return NextResponse.json({ error: "Número do crachá é obrigatório." }, { status: 400 })
  }

  try {
    // In a real application, you would send an email or SMS with the access code
    // For this example, we'll just retrieve it and pretend to send it.
    const { data: collaborator, error } = await supabase
      .from("collaborators")
      .select("access_code")
      .eq("badge_number", badgeNumber)
      .single()

    if (error || !collaborator) {
      return NextResponse.json({ error: "Número do crachá não encontrado." }, { status: 404 })
    }

    // Simulate sending the access code
    console.log(`Simulando envio do código de acesso para o crachá ${badgeNumber}: ${collaborator.access_code}`)

    return NextResponse.json({ message: "Se o número do crachá estiver correto, seu código de acesso foi enviado." })
  } catch (error: any) {
    console.error("Erro ao solicitar código de acesso:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

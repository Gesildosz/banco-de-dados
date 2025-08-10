import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { getSession } from "@/lib/session"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { collaborator_id, date, hours_worked, entry_type, description } = await request.json()
  const supabase = createServerClient()

  // Check admin permission
  const { data: currentAdmin, error: adminError } = await supabase
    .from("administrators")
    .select("can_enter_hours")
    .eq("id", session.userId)
    .single()

  if (adminError || !currentAdmin?.can_enter_hours) {
    return NextResponse.json({ error: "Você não tem permissão para lançar horas." }, { status: 403 })
  }

  if (!collaborator_id || !date || hours_worked === undefined || !entry_type) {
    return NextResponse.json({ error: "Dados incompletos para o lançamento de horas." }, { status: 400 })
  }

  try {
    // Fetch current balance for the collaborator
    const { data: collaboratorData, error: collabError } = await supabase
      .from("collaborators")
      .select("balance_hours")
      .eq("id", collaborator_id)
      .single()

    if (collabError || !collaboratorData) {
      return NextResponse.json({ error: "Colaborador não encontrado ou erro ao buscar saldo." }, { status: 404 })
    }

    let newBalance = collaboratorData.balance_hours || 0
    let overtimeHours = 0
    let balanceHoursChange = 0

    if (entry_type === "positive") {
      balanceHoursChange = hours_worked
      newBalance += hours_worked
    } else if (entry_type === "negative") {
      balanceHoursChange = -hours_worked
      newBalance -= hours_worked
    } else if (entry_type === "overtime") {
      overtimeHours = hours_worked
      balanceHoursChange = hours_worked // Overtime also adds to balance
      newBalance += hours_worked
    } else {
      return NextResponse.json({ error: "Tipo de lançamento inválido." }, { status: 400 })
    }

    // Insert new time entry
    const { error: entryError } = await supabase.from("time_entries").insert([
      {
        collaborator_id,
        date,
        hours_worked: hours_worked,
        overtime_hours: overtimeHours,
        balance_hours: balanceHoursChange, // This is the change for THIS entry
        entry_type,
        description,
      },
    ])

    if (entryError) {
      console.error("Erro ao inserir lançamento de horas:", entryError.message)
      return NextResponse.json({ error: "Falha ao registrar lançamento de horas." }, { status: 500 })
    }

    // Update collaborator's total balance
    const { error: updateError } = await supabase
      .from("collaborators")
      .update({ balance_hours: newBalance, updated_at: new Date().toISOString() }) // Adicionado updated_at explicitamente
      .eq("id", collaborator_id)

    if (updateError) {
      console.error("Erro ao atualizar saldo do colaborador:", updateError.message)
      return NextResponse.json({ error: "Falha ao atualizar saldo do colaborador." }, { status: 500 })
    }

    return NextResponse.json({ message: "Lançamento de horas registrado e saldo atualizado com sucesso." })
  } catch (error: any) {
    console.error("Erro interno do servidor ao lançar horas:", error.message)
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 })
  }
}

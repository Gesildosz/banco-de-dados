"use client"

import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { InfoBannerSlider } from "@/components/info-banner-slider"
import { CountdownTimer } from "@/components/countdown-timer"

interface CollaboratorSummary {
  full_name: string
  badge_number: string
  balance_hours: number
  last_updated: string
}

interface TimeBankPeriod {
  id: string
  start_date: string
  end_date: string
  is_active: boolean
}

interface LeaveRequest {
  id: string
  request_date: string
  start_date: string
  end_date: string
  hours_requested: number
  status: "pending" | "approved" | "rejected"
  reason: string | null
}

export default function CollaboratorDashboardPage() {
  const [collaboratorData, setCollaboratorData] = useState<CollaboratorSummary | null>(null)
  const [timeBankPeriod, setTimeBankPeriod] = useState<TimeBankPeriod | null>(null)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [leaveRequestForm, setLeaveRequestForm] = useState({
    startDate: "",
    endDate: "",
    hoursRequested: "",
    reason: "",
  })
  const router = useRouter()
  const supabase = createClientSideSupabase()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch session data
        const sessionRes = await fetch("/api/auth/get-session")
        const sessionData = await sessionRes.json()

        if (!sessionRes.ok || !sessionData.session || sessionData.session.userType !== "collaborator") {
          toast({ title: "Sessão expirada", description: "Por favor, faça login novamente.", variant: "destructive" })
          router.push("/login")
          return
        }

        // Fetch collaborator data
        const collabRes = await fetch("/api/collaborator-data")
        if (!collabRes.ok) {
          throw new Error(`HTTP error! status: ${collabRes.status}`)
        }
        const collabData = await collabRes.json()
        setCollaboratorData(collabData)

        // Fetch time bank period
        const periodRes = await fetch("/api/collaborator/time-bank-period")
        if (!periodRes.ok) {
          throw new Error(`HTTP error! status: ${periodRes.status}`)
        }
        const periodData = await periodRes.json()
        if (periodData.message && periodData.message.includes("Nenhum período")) {
          setTimeBankPeriod(null) // No active period found
        } else {
          setTimeBankPeriod(periodData)
        }

        // Fetch leave requests
        const leaveRes = await fetch("/api/collaborator/leave-requests")
        if (!leaveRes.ok) {
          throw new Error(`HTTP error! status: ${leaveRes.status}`)
        }
        const leaveData = await leaveRes.json()
        setLeaveRequests(leaveData)
      } catch (error: any) {
        console.error("Erro ao carregar dados do colaborador:", error)
        toast({ title: "Erro", description: error.message || "Falha ao carregar dados do painel." })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
      await fetch("/api/auth/logout", { method: "POST" }) // Clear server session
      toast({ title: "Sucesso", description: "Você foi desconectado." })
      router.push("/login")
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error)
      toast({ title: "Erro", description: error.message || "Falha ao fazer logout." })
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveRequestChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setLeaveRequestForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleLeaveRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const hours = Number.parseFloat(leaveRequestForm.hoursRequested)
    if (isNaN(hours) || hours <= 0) {
      toast({ title: "Erro", description: "Horas solicitadas devem ser um número positivo." })
      setLoading(false)
      return
    }

    if (collaboratorData && hours > collaboratorData.balance_hours) {
      toast({ title: "Erro", description: "Horas solicitadas excedem seu saldo atual." })
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/collaborator/leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_date: leaveRequestForm.startDate,
          end_date: leaveRequestForm.endDate,
          hours_requested: hours,
          reason: leaveRequestForm.reason,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({ title: "Sucesso", description: data.message })
        // Refresh leave requests and collaborator data
        const [leaveRes, collabRes] = await Promise.all([
          fetch("/api/collaborator/leave-requests"),
          fetch("/api/collaborator-data"),
        ])
        if (leaveRes.ok) setLeaveRequests(await leaveRes.json())
        if (collabRes.ok) setCollaboratorData(await collabRes.json())
        setLeaveRequestForm({ startDate: "", endDate: "", hoursRequested: "", reason: "" })
      } else {
        toast({ title: "Erro", description: data.error || "Falha ao enviar solicitação de folga." })
      }
    } catch (error: any) {
      console.error("Erro ao enviar solicitação de folga:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado ao enviar a solicitação." })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !collaboratorData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando painel do colaborador...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 p-4 dark:bg-gray-950">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Painel do Colaborador</h1>
        <Button onClick={handleLogout} disabled={loading}>
          Sair
        </Button>
      </header>

      <InfoBannerSlider />

      <main className="flex-1 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card de Saldo de Horas */}
          <Card>
            <CardHeader>
              <CardTitle>Saldo de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {collaboratorData?.balance_hours.toFixed(2) || "0.00"}h
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Última atualização:{" "}
                {collaboratorData?.last_updated
                  ? format(new Date(collaboratorData.last_updated), "dd/MM/yyyy HH:mm", { locale: ptBR })
                  : "N/A"}
              </p>
            </CardContent>
          </Card>

          {/* Card de Período do Banco de Horas */}
          <Card>
            <CardHeader>
              <CardTitle>Período Atual do Banco de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              {timeBankPeriod ? (
                <>
                  <p>
                    Início:{" "}
                    {format(new Date(timeBankPeriod.start_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <p>
                    Fim:{" "}
                    {format(new Date(timeBankPeriod.end_date), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                  <CountdownTimer endDate={timeBankPeriod.end_date} />
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Nenhum período ativo configurado.</p>
              )}
            </CardContent>
          </Card>

          {/* Card de Solicitar Folga */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Solicitar Folga</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLeaveRequestSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={leaveRequestForm.startDate}
                    onChange={handleLeaveRequestChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Fim</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={leaveRequestForm.endDate}
                    onChange={handleLeaveRequestChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hoursRequested">Horas Solicitadas</Label>
                  <Input
                    id="hoursRequested"
                    name="hoursRequested"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 8.00"
                    value={leaveRequestForm.hoursRequested}
                    onChange={handleLeaveRequestChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">Motivo (Opcional)</Label>
                  <textarea
                    id="reason"
                    name="reason"
                    rows={3}
                    className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={leaveRequestForm.reason}
                    onChange={handleLeaveRequestChange}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar Solicitação de Folga"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Card de Histórico de Solicitações de Folga */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Solicitações de Folga</CardTitle>
          </CardHeader>
          <CardContent>
            {leaveRequests.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhuma solicitação de folga encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Data da Solicitação
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Início
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Fim</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Horas
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map((request) => (
                      <tr key={request.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2 text-sm">
                          {format(new Date(request.request_date), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {format(new Date(request.start_date), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {format(new Date(request.end_date), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-sm">{request.hours_requested.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm capitalize">{request.status}</td>
                        <td className="px-4 py-2 text-sm">{request.reason || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

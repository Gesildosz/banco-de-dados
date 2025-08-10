"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import ptBR from "date-fns/locale/pt-BR"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface LeaveRequest {
  id: string
  collaborator_id: string
  collaborators: {
    full_name: string
    badge_number: string
  }
  start_date: string
  end_date: string
  reason: string
  status: "pending" | "approved" | "rejected"
  created_at: string
}

export default function LeaveRequestsPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const sessionRes = await fetch("/api/auth/get-session")
      if (!sessionRes.ok) {
        toast({ title: "Erro", description: "Sessão expirada ou inválida. Por favor, faça login novamente." })
        router.push("/login")
        return
      }
      const sessionData = await sessionRes.json()

      if (sessionData.role !== "admin") {
        toast({ title: "Erro", description: "Acesso negado. Você não é um administrador." })
        router.push("/login")
        return
      }

      const adminRes = await fetch(`/api/admin/get-admin-data?id=${sessionData.userId}`)
      if (!adminRes.ok) {
        toast({ title: "Erro", description: "Falha ao carregar dados do administrador." })
        router.push("/login")
        return
      }
      const adminData = await adminRes.json()
      if (!adminData.can_enter_hours) {
        // Assuming can_enter_hours also grants permission to manage leave requests
        toast({ title: "Erro", description: "Você não tem permissão para gerenciar solicitações de folga." })
        router.push("/admin")
        return
      }

      const { data, error } = await supabase
        .from("leave_requests")
        .select("*, collaborators(full_name, badge_number)")
        .order("created_at", { ascending: false })

      if (error) {
        throw error
      }
      setLeaveRequests(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar solicitações de folga:", error.message)
      toast({ title: "Erro", description: "Falha ao carregar solicitações de folga." })
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (requestId: string, newStatus: "approved" | "rejected") => {
    if (!confirm(`Tem certeza que deseja ${newStatus === "approved" ? "aprovar" : "rejeitar"} esta solicitação?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/leave-requests/${requestId}/approve-reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Solicitação ${newStatus === "approved" ? "aprovada" : "rejeitada"} com sucesso!`,
        })
        fetchLeaveRequests() // Refresh the list
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao atualizar status da solicitação." })
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "text-yellow-600"
      case "approved":
        return "text-green-600"
      case "rejected":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando solicitações de folga...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Solicitações de Folga</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma solicitação de folga encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        {request.collaborators?.full_name} ({request.collaborators?.badge_number})
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.start_date), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(new Date(request.end_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getStatusColor(request.status)}`}>
                          {request.status === "pending" && "Pendente"}
                          {request.status === "approved" && "Aprovada"}
                          {request.status === "rejected" && "Rejeitada"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mr-2 bg-green-500 text-white hover:bg-green-600"
                              onClick={() => handleStatusChange(request.id, "approved")}
                            >
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-red-500 text-white hover:bg-red-600"
                              onClick={() => handleStatusChange(request.id, "rejected")}
                            >
                              Rejeitar
                            </Button>
                          </>
                        )}
                        {request.status !== "pending" && <span className="text-muted-foreground">Ação concluída</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

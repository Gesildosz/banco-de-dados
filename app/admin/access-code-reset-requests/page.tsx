"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale" // Corrected import
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface AccessCodeResetRequest {
  id: string
  collaborator_id: string
  collaborators: {
    full_name: string
    badge_number: string
    access_code: string
  }
  status: "pending" | "approved" | "rejected"
  requested_at: string
  processed_at: string | null
  admin_id: string | null
  notes: string | null
}

export default function AccessCodeResetRequestsPage() {
  const [requests, setRequests] = useState<AccessCodeResetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<AccessCodeResetRequest | null>(null)
  const [newAccessCode, setNewAccessCode] = useState("")
  const [notes, setNotes] = useState("")
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
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
      if (!adminData.can_change_access_code) {
        toast({
          title: "Erro",
          description: "Você não tem permissão para gerenciar solicitações de redefinição de código de acesso.",
        })
        router.push("/admin")
        return
      }

      const { data, error } = await supabase
        .from("access_code_reset_requests")
        .select("*, collaborators(full_name, badge_number, access_code)")
        .order("requested_at", { ascending: false })

      if (error) {
        throw error
      }
      setRequests(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar solicitações de redefinição de código de acesso:", error.message)
      toast({ title: "Erro", description: "Falha ao carregar solicitações de redefinição de código de acesso." })
    } finally {
      setLoading(false)
    }
  }

  const handleApproveReject = async (status: "approved" | "rejected") => {
    if (!selectedRequest) return

    if (status === "approved" && !newAccessCode) {
      toast({ title: "Erro", description: "Por favor, insira o novo código de acesso para aprovar." })
      return
    }

    if (!confirm(`Tem certeza que deseja ${status === "approved" ? "aprovar" : "rejeitar"} esta solicitação?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/access-code-reset-requests/${selectedRequest.id}/approve-reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, newAccessCode, notes }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Solicitação ${status === "approved" ? "aprovada" : "rejeitada"} com sucesso!`,
        })
        setIsDialogOpen(false)
        setSelectedRequest(null)
        setNewAccessCode("")
        setNotes("")
        fetchRequests() // Refresh the list
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao atualizar status da solicitação." })
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    }
  }

  const openDialog = (request: AccessCodeResetRequest) => {
    setSelectedRequest(request)
    setNewAccessCode(request.collaborators.access_code) // Pre-fill with current code
    setNotes(request.notes || "")
    setIsDialogOpen(true)
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
        <p>Carregando solicitações...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Solicitações de Redefinição de Código de Acesso</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma solicitação de redefinição de código de acesso encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Crachá</TableHead>
                    <TableHead>Código Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Solicitado Em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.collaborators?.full_name}</TableCell>
                      <TableCell>{request.collaborators?.badge_number}</TableCell>
                      <TableCell>{request.collaborators?.access_code}</TableCell>
                      <TableCell>
                        <span className={`font-semibold ${getStatusColor(request.status)}`}>
                          {request.status === "pending" && "Pendente"}
                          {request.status === "approved" && "Aprovada"}
                          {request.status === "rejected" && "Rejeitada"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.requested_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        {request.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                            Gerenciar
                          </Button>
                        )}
                        {request.status !== "pending" && <span className="text-muted-foreground">Processada</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Gerenciar Solicitação de Redefinição</DialogTitle>
            <DialogDescription>
              Revise a solicitação de {selectedRequest?.collaborators?.full_name} e decida se aprova ou rejeita.
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Colaborador:</Label>
                <span className="col-span-3 font-medium">
                  {selectedRequest.collaborators?.full_name} ({selectedRequest.collaborators?.badge_number})
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Código Atual:</Label>
                <span className="col-span-3 font-mono">{selectedRequest.collaborators?.access_code}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-access-code" className="text-right">
                  Novo Código:
                </Label>
                <Input
                  id="new-access-code"
                  value={newAccessCode}
                  onChange={(e) => setNewAccessCode(e.target.value)}
                  className="col-span-3"
                  placeholder="Digite o novo código"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas:
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Adicione notas sobre a decisão (opcional)"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => handleApproveReject("rejected")}>
              Rejeitar
            </Button>
            <Button onClick={() => handleApproveReject("approved")}>Aprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

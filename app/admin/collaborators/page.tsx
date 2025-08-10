"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Collaborator {
  id: string
  full_name: string
  badge_number: string
  access_code: string
  direct_leader: string | null
  balance_hours: number
}

export default function CollaboratorsPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [newCollaborator, setNewCollaborator] = useState({
    full_name: "",
    badge_number: "",
    access_code: "",
    direct_leader: "",
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  const supervisors = ["Osmar Pereira", "Gesildo Silva", "Edvaldo Oliveira", "Raimundo"]

  useEffect(() => {
    fetchCollaborators()
  }, [])

  const fetchCollaborators = async () => {
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
      if (!adminData.can_create_collaborator) {
        toast({ title: "Erro", description: "Você não tem permissão para gerenciar colaboradores." })
        router.push("/admin")
        return
      }

      const { data, error } = await supabase.from("collaborators").select("*").order("full_name")
      if (error) {
        throw error
      }
      setCollaborators(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar colaboradores:", error.message)
      toast({ title: "Erro", description: "Falha ao carregar lista de colaboradores." })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewCollaborator((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (value: string, field: keyof typeof newCollaborator) => {
    setNewCollaborator((prev) => ({ ...prev, [field]: value }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setEditingCollaborator((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleEditSelectChange = (value: string, field: keyof Collaborator) => {
    setEditingCollaborator((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleAddCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch("/api/admin/collaborators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCollaborator),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Colaborador adicionado com sucesso!" })
      setNewCollaborator({
        full_name: "",
        badge_number: "",
        access_code: "",
        direct_leader: "",
      })
      setIsDialogOpen(false)
      fetchCollaborators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao adicionar colaborador." })
      console.error("Error adding collaborator:", errorData)
    }
  }

  const handleUpdateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCollaborator) return

    const { id, ...updates } = editingCollaborator
    const response = await fetch(`/api/admin/collaborators/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Colaborador atualizado com sucesso!" })
      setEditingCollaborator(null)
      setIsDialogOpen(false)
      fetchCollaborators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao atualizar colaborador." })
      console.error("Error updating collaborator:", errorData)
    }
  }

  const handleDeleteCollaborator = async (id: string) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este colaborador? Todas as horas e solicitações de folga associadas também serão excluídas.",
      )
    )
      return
    const response = await fetch(`/api/admin/collaborators/${id}`, { method: "DELETE" })
    if (response.ok) {
      toast({ title: "Sucesso", description: "Colaborador excluído com sucesso!" })
      fetchCollaborators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao excluir colaborador." })
      console.error("Error deleting collaborator:", errorData)
    }
  }

  const openEditDialog = (collab: Collaborator) => {
    setEditingCollaborator(collab)
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando colaboradores...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Colaboradores</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button
              onClick={() => {
                setNewCollaborator({
                  full_name: "",
                  badge_number: "",
                  access_code: "",
                  direct_leader: "",
                })
                setEditingCollaborator(null)
                setIsDialogOpen(true)
              }}
            >
              Adicionar Novo Colaborador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {collaborators.length === 0 ? (
            <p className="text-muted-foreground">Nenhum colaborador encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Crachá</TableHead>
                    <TableHead>Código de Acesso</TableHead>
                    <TableHead>Líder Direto</TableHead>
                    <TableHead className="text-right">Saldo (horas)</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collaborators.map((collab) => (
                    <TableRow key={collab.id}>
                      <TableCell>{collab.full_name}</TableCell>
                      <TableCell>{collab.badge_number}</TableCell>
                      <TableCell>{collab.access_code}</TableCell>
                      <TableCell>{collab.direct_leader || "N/A"}</TableCell>
                      <TableCell
                        className={`text-right ${collab.balance_hours > 0 ? "text-green-600" : collab.balance_hours < 0 ? "text-red-600" : "text-gray-500"}`}
                      >
                        {collab.balance_hours.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 bg-transparent"
                          onClick={() => openEditDialog(collab)}
                        >
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteCollaborator(collab.id)}>
                          Excluir
                        </Button>
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
            <DialogTitle>{editingCollaborator ? "Editar Colaborador" : "Adicionar Novo Colaborador"}</DialogTitle>
            <DialogDescription>
              {editingCollaborator
                ? "Faça alterações nos detalhes do colaborador aqui."
                : "Preencha os detalhes para adicionar um novo colaborador."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editingCollaborator ? handleUpdateCollaborator : handleAddCollaborator}
            className="grid gap-4 py-4"
          >
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Nome Completo
              </Label>
              <Input
                id="full_name"
                value={editingCollaborator?.full_name || newCollaborator.full_name}
                onChange={editingCollaborator ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="badge_number" className="text-right">
                Crachá
              </Label>
              <Input
                id="badge_number"
                value={editingCollaborator?.badge_number || newCollaborator.badge_number}
                onChange={editingCollaborator ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="access_code" className="text-right">
                Código de Acesso
              </Label>
              <Input
                id="access_code"
                value={editingCollaborator?.access_code || newCollaborator.access_code}
                onChange={editingCollaborator ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="direct_leader" className="text-right">
                Líder Direto
              </Label>
              <Select
                value={editingCollaborator?.direct_leader || newCollaborator.direct_leader || ""}
                onValueChange={(value) =>
                  editingCollaborator
                    ? handleEditSelectChange(value, "direct_leader")
                    : handleSelectChange(value, "direct_leader")
                }
              >
                <SelectTrigger id="direct_leader" className="col-span-3">
                  <SelectValue placeholder="Selecione um líder" />
                </SelectTrigger>
                <SelectContent>
                  {supervisors.map((leader) => (
                    <SelectItem key={leader} value={leader}>
                      {leader}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">{editingCollaborator ? "Salvar Alterações" : "Adicionar Colaborador"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Administrator {
  id: string
  full_name: string
  username: string
  can_create_collaborator: boolean
  can_create_admin: boolean
  can_enter_hours: boolean
  can_change_access_code: boolean
}

export default function AdministratorsPage() {
  const [administrators, setAdministrators] = useState<Administrator[]>([])
  const [loading, setLoading] = useState(true)
  const [newAdmin, setNewAdmin] = useState({
    full_name: "",
    username: "",
    password: "",
    can_create_collaborator: false,
    can_create_admin: false,
    can_enter_hours: false,
    can_change_access_code: false,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<Administrator | null>(null)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
    fetchAdministrators()
  }, [])

  const fetchAdministrators = async () => {
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
      if (!adminData.can_create_admin) {
        toast({ title: "Erro", description: "Você não tem permissão para gerenciar administradores." })
        router.push("/admin")
        return
      }

      const { data, error } = await supabase.from("administrators").select("*").order("full_name")
      if (error) {
        throw error
      }
      setAdministrators(data || [])
    } catch (error: any) {
      console.error("Erro ao carregar administradores:", error.message)
      toast({ title: "Erro", description: "Falha ao carregar lista de administradores." })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewAdmin((prev) => ({ ...prev, [id]: value }))
  }

  const handleSwitchChange = (checked: boolean, field: keyof typeof newAdmin) => {
    setNewAdmin((prev) => ({ ...prev, [field]: checked }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setEditingAdmin((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleEditSwitchChange = (checked: boolean, field: keyof Administrator) => {
    setEditingAdmin((prev) => (prev ? { ...prev, [field]: checked } : null))
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch("/api/admin/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAdmin),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Administrador adicionado com sucesso!" })
      setNewAdmin({
        full_name: "",
        username: "",
        password: "",
        can_create_collaborator: false,
        can_create_admin: false,
        can_enter_hours: false,
        can_change_access_code: false,
      })
      setIsDialogOpen(false)
      fetchAdministrators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao adicionar administrador." })
      console.error("Error adding admin:", errorData)
    }
  }

  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingAdmin) return

    const { id, ...updates } = editingAdmin
    const response = await fetch(`/api/admin/update-admin/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Administrador atualizado com sucesso!" })
      setEditingAdmin(null)
      setIsDialogOpen(false)
      fetchAdministrators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao atualizar administrador." })
      console.error("Error updating admin:", errorData)
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este administrador?")) return
    const response = await fetch(`/api/admin/delete-admin/${id}`, { method: "DELETE" })
    if (response.ok) {
      toast({ title: "Sucesso", description: "Administrador excluído com sucesso!" })
      fetchAdministrators()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao excluir administrador." })
      console.error("Error deleting admin:", errorData)
    }
  }

  const openEditDialog = (admin: Administrator) => {
    setEditingAdmin(admin)
    setIsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando administradores...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Administradores</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button
              onClick={() => {
                setNewAdmin({
                  full_name: "",
                  username: "",
                  password: "",
                  can_create_collaborator: false,
                  can_create_admin: false,
                  can_enter_hours: false,
                  can_change_access_code: false,
                })
                setEditingAdmin(null)
                setIsDialogOpen(true)
              }}
            >
              Adicionar Novo Administrador
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {administrators.length === 0 ? (
            <p className="text-muted-foreground">Nenhum administrador encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Permissões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {administrators.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>{admin.full_name}</TableCell>
                      <TableCell>{admin.username}</TableCell>
                      <TableCell>
                        {admin.can_create_collaborator && "Colaborador, "}
                        {admin.can_create_admin && "Admin, "}
                        {admin.can_enter_hours && "Horas, "}
                        {admin.can_change_access_code && "Código"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 bg-transparent"
                          onClick={() => openEditDialog(admin)}
                        >
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteAdmin(admin.id)}>
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
            <DialogTitle>{editingAdmin ? "Editar Administrador" : "Adicionar Novo Administrador"}</DialogTitle>
            <DialogDescription>
              {editingAdmin
                ? "Faça alterações nos detalhes do administrador aqui."
                : "Preencha os detalhes para adicionar um novo administrador."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingAdmin ? handleUpdateAdmin : handleAddAdmin} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="full_name" className="text-right">
                Nome Completo
              </Label>
              <Input
                id="full_name"
                value={editingAdmin?.full_name || newAdmin.full_name}
                onChange={editingAdmin ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Usuário
              </Label>
              <Input
                id="username"
                value={editingAdmin?.username || newAdmin.username}
                onChange={editingAdmin ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Senha {editingAdmin && "(Deixe em branco para não alterar)"}
              </Label>
              <Input
                id="password"
                type="password"
                value={editingAdmin ? "" : newAdmin.password} // Clear password field for editing
                onChange={editingAdmin ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                required={!editingAdmin} // Password is required only for new admin
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="can_create_collaborator" className="text-right">
                Criar Colaborador
              </Label>
              <Switch
                id="can_create_collaborator"
                checked={editingAdmin?.can_create_collaborator ?? newAdmin.can_create_collaborator}
                onCheckedChange={(checked) =>
                  editingAdmin
                    ? handleEditSwitchChange(checked as boolean, "can_create_collaborator")
                    : handleSwitchChange(checked as boolean, "can_create_collaborator")
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="can_create_admin" className="text-right">
                Criar Admin
              </Label>
              <Switch
                id="can_create_admin"
                checked={editingAdmin?.can_create_admin ?? newAdmin.can_create_admin}
                onCheckedChange={(checked) =>
                  editingAdmin
                    ? handleEditSwitchChange(checked as boolean, "can_create_admin")
                    : handleSwitchChange(checked as boolean, "can_create_admin")
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="can_enter_hours" className="text-right">
                Lançar Horas
              </Label>
              <Switch
                id="can_enter_hours"
                checked={editingAdmin?.can_enter_hours ?? newAdmin.can_enter_hours}
                onCheckedChange={(checked) =>
                  editingAdmin
                    ? handleEditSwitchChange(checked as boolean, "can_enter_hours")
                    : handleSwitchChange(checked as boolean, "can_enter_hours")
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="can_change_access_code" className="text-right">
                Alterar Código Acesso
              </Label>
              <Switch
                id="can_change_access_code"
                checked={editingAdmin?.can_change_access_code ?? newAdmin.can_change_access_code}
                onCheckedChange={(checked) =>
                  editingAdmin
                    ? handleEditSwitchChange(checked as boolean, "can_change_access_code")
                    : handleSwitchChange(checked as boolean, "can_change_access_code")
                }
                className="col-span-3"
              />
            </div>
            <DialogFooter>
              <Button type="submit">{editingAdmin ? "Salvar Alterações" : "Adicionar Administrador"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

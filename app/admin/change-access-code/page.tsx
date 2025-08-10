"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Collaborator {
  id: string
  full_name: string
  badge_number: string
  access_code: string
}

export default function ChangeAccessCodePage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>("")
  const [newAccessCode, setNewAccessCode] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
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
        if (!adminData.can_change_access_code) {
          toast({ title: "Erro", description: "Você não tem permissão para alterar códigos de acesso." })
          router.push("/admin")
          return
        }

        const { data, error } = await supabase
          .from("collaborators")
          .select("id, full_name, badge_number, access_code")
          .order("full_name")
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

    fetchCollaborators()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!selectedCollaboratorId || !newAccessCode) {
      toast({ title: "Erro", description: "Por favor, selecione um colaborador e digite o novo código de acesso." })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/admin/change-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaboratorId: selectedCollaboratorId,
          newAccessCode,
        }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Código de acesso alterado com sucesso!" })
        // Update the access code in the local state for the selected collaborator
        setCollaborators((prev) =>
          prev.map((collab) =>
            collab.id === selectedCollaboratorId ? { ...collab, access_code: newAccessCode } : collab,
          ),
        )
        setNewAccessCode("") // Clear the input field
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao alterar o código de acesso." })
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSelectedCollaboratorCurrentCode = () => {
    const collab = collaborators.find((c) => c.id === selectedCollaboratorId)
    return collab ? collab.access_code : "N/A"
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
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Alterar Código de Acesso</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collaborator">Colaborador</Label>
              <Select value={selectedCollaboratorId} onValueChange={setSelectedCollaboratorId}>
                <SelectTrigger id="collaborator">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {collaborators.map((collab) => (
                    <SelectItem key={collab.id} value={collab.id}>
                      {collab.full_name} ({collab.badge_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCollaboratorId && (
              <div className="space-y-2">
                <Label>Código de Acesso Atual</Label>
                <Input type="text" value={getSelectedCollaboratorCurrentCode()} disabled className="font-mono" />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="new-access-code">Novo Código de Acesso</Label>
              <Input
                id="new-access-code"
                type="text"
                placeholder="Digite o novo código de acesso"
                value={newAccessCode}
                onChange={(e) => setNewAccessCode(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Alterando..." : "Alterar Código de Acesso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

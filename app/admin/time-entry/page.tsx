"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface Collaborator {
  id: string
  full_name: string
  badge_number: string
}

export default function TimeEntryPage() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [hoursWorked, setHoursWorked] = useState<string>("")
  const [entryType, setEntryType] = useState<"positive" | "negative" | "overtime">("positive")
  const [description, setDescription] = useState<string>("")
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
        if (!adminData.can_enter_hours) {
          toast({ title: "Erro", description: "Você não tem permissão para lançar horas." })
          router.push("/admin")
          return
        }

        const { data, error } = await supabase
          .from("collaborators")
          .select("id, full_name, badge_number")
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

    if (!selectedCollaborator || !date || !hoursWorked || !entryType) {
      toast({ title: "Erro", description: "Por favor, preencha todos os campos obrigatórios." })
      setIsSubmitting(false)
      return
    }

    const parsedHours = Number.parseFloat(hoursWorked)
    if (isNaN(parsedHours) || parsedHours <= 0) {
      toast({ title: "Erro", description: "Horas trabalhadas deve ser um número positivo." })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/admin/time-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collaborator_id: selectedCollaborator,
          date,
          hours_worked: parsedHours,
          entry_type: entryType,
          description,
        }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Lançamento de horas realizado com sucesso!" })
        // Reset form
        setSelectedCollaborator("")
        setDate("")
        setHoursWorked("")
        setEntryType("positive")
        setDescription("")
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao registrar lançamento de horas." })
      }
    } catch (error) {
      console.error("Erro ao enviar lançamento de horas:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setIsSubmitting(false)
    }
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
          <CardTitle className="text-2xl">Lançamento de Horas</CardTitle>
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
              <Select value={selectedCollaborator} onValueChange={setSelectedCollaborator}>
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

            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hours-worked">Horas (Ex: 8.50)</Label>
              <Input
                id="hours-worked"
                type="number"
                step="0.01"
                placeholder="Ex: 8.50"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-type">Tipo de Lançamento</Label>
              <Select
                value={entryType}
                onValueChange={(value: "positive" | "negative" | "overtime") => setEntryType(value)}
              >
                <SelectTrigger id="entry-type">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positive">Horas Positivas</SelectItem>
                  <SelectItem value="negative">Horas Negativas</SelectItem>
                  <SelectItem value="overtime">Horas Extras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o motivo do lançamento..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Registrando..." : "Registrar Lançamento"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

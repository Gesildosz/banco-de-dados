"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Lock } from "lucide-react"

export default function SetupAccessCodePage() {
  const [accessCode, setAccessCode] = useState("")
  const [confirmAccessCode, setConfirmAccessCode] = useState("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null)
  const [badgeNumber, setBadgeNumber] = useState<string | null>(null) // To get badge number for Supabase Auth email

  const router = useRouter()
  const supabase = createClientSideSupabase()

  useEffect(() => {
    async function checkSession() {
      const sessionRes = await fetch("/api/auth/get-session")
      const sessionData = await sessionRes.json()

      if (!sessionRes.ok || !sessionData.session || sessionData.session.userType !== "collaborator") {
        toast({ title: "Erro", description: "Sessão inválida. Por favor, faça login novamente." })
        router.push("/login")
        return
      }

      if (!sessionData.session.pendingAccessCode) {
        // If not pending access code, means they already set it or shouldn't be here
        toast({ title: "Aviso", description: "Você já possui um código de acesso ou não deveria estar aqui." })
        router.push("/collaborator")
        return
      }

      setCollaboratorId(sessionData.session.userId)

      // Fetch collaborator's badge number using userId from session
      const { data: collab, error: collabError } = await supabase
        .from("collaborators")
        .select("badge_number")
        .eq("id", sessionData.session.userId)
        .single()

      if (collabError || !collab) {
        console.error("Erro ao buscar número do crachá:", collabError?.message || "Colaborador não encontrado.")
        toast({ title: "Erro", description: "Falha ao carregar dados do colaborador." })
        router.push("/login")
        return
      }
      setBadgeNumber(collab.badge_number)
      setLoading(false)
    }

    checkSession()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (accessCode !== confirmAccessCode) {
      toast({ title: "Erro", description: "Os códigos de acesso não coincidem." })
      setIsSubmitting(false)
      return
    }

    if (!collaboratorId || !badgeNumber) {
      toast({ title: "Erro", description: "Dados do colaborador ausentes. Tente novamente." })
      setIsSubmitting(false)
      return
    }

    try {
      // 1. Update Supabase Auth user's password
      const { data: authUpdateData, error: authUpdateError } = await supabase.auth.updateUser({
        email: `${badgeNumber}@timebank.com`, // Use badge number as email for Supabase Auth
        password: accessCode,
      })

      if (authUpdateError) {
        console.error("Erro ao atualizar senha no Supabase Auth:", authUpdateError.message)
        toast({ title: "Erro", description: authUpdateError.message || "Falha ao definir código de acesso." })
        setIsSubmitting(false)
        return
      }

      // 2. Update collaborators table to mark access_code_set as true
      const { error: dbUpdateError } = await supabase
        .from("collaborators")
        .update({ access_code_set: true })
        .eq("id", collaboratorId)

      if (dbUpdateError) {
        console.error("Erro ao atualizar DB (access_code_set):", dbUpdateError.message)
        toast({ title: "Erro", description: "Falha ao finalizar o cadastro do código de acesso no banco de dados." })
        setIsSubmitting(false)
        return
      }

      // 3. Clear pendingAccessCode from session on server
      await fetch("/api/auth/clear-pending-access-code", { method: "POST" })

      toast({ title: "Sucesso", description: "Código de acesso cadastrado com sucesso!" })
      router.push("/collaborator") // Redirect to collaborator dashboard
    } catch (error: any) {
      console.error("Erro inesperado ao cadastrar código de acesso:", error.message)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Cadastrar Código de Acesso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="access-code">Novo Código de Acesso</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="access-code"
                  type="password"
                  placeholder="Digite seu novo código de acesso"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  required
                  minLength={6}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-access-code">Confirmar Código de Acesso</Label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  id="confirm-access-code"
                  type="password"
                  placeholder="Confirme seu novo código de acesso"
                  value={confirmAccessCode}
                  onChange={(e) => setConfirmAccessCode(e.target.value)}
                  required
                  minLength={6}
                  className="pl-9"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Cadastrando..." : "Cadastrar Código de Acesso"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

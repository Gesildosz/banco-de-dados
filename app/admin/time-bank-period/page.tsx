"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { formatBrazilianDate } from "@/utils/date-helpers"
import { CountdownTimer } from "@/components/countdown-timer"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface TimeBankPeriod {
  id: string
  start_date: string
  end_date: string
  is_active: boolean
  admin_id: string | null
  created_at: string
  updated_at: string
}

export default function TimeBankPeriodPage() {
  const [currentPeriod, setCurrentPeriod] = useState<TimeBankPeriod | null>(null)
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchCurrentPeriod()
  }, [])

  const fetchCurrentPeriod = async () => {
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
        toast({ title: "Erro", description: "Você não tem permissão para gerenciar o período do banco de horas." })
        router.push("/admin")
        return
      }

      const response = await fetch("/api/admin/time-bank-period")
      if (response.ok) {
        const data = await response.json()
        setCurrentPeriod(data)
        if (data) {
          setStartDate(data.start_date)
          setEndDate(data.end_date)
        }
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao carregar período do banco de horas." })
        console.error("Error fetching time bank period:", errorData)
      }
    } catch (error) {
      console.error("Erro ao buscar período do banco de horas:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o período." })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (!startDate || !endDate) {
      toast({ title: "Erro", description: "Por favor, preencha as datas de início e término." })
      setIsSubmitting(false)
      return
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast({ title: "Erro", description: "A data de início deve ser anterior à data de término." })
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/admin/time-bank-period", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate }),
      })

      if (response.ok) {
        toast({ title: "Sucesso", description: "Período do banco de horas definido com sucesso!" })
        fetchCurrentPeriod() // Refresh data
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao definir período do banco de horas." })
      }
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando período do banco de horas...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Período BH</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {currentPeriod ? (
            <div className="space-y-4 text-center">
              <p className="text-lg font-semibold">Período Ativo:</p>
              <p className="text-xl">
                {formatBrazilianDate(currentPeriod.start_date)} até {formatBrazilianDate(currentPeriod.end_date)}
              </p>
              <p className="text-md text-muted-foreground">
                (Definido em: {formatBrazilianDate(currentPeriod.created_at)})
              </p>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Tempo Restante:</h3>
                <CountdownTimer targetDate={currentPeriod.end_date} />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Definir um novo período irá desativar o período atual.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-center">Nenhum período do banco de horas ativo.</p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Data de Início do Novo Período</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Data de Término do Novo Período</Label>
              <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Definindo..." : "Definir Novo Período"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

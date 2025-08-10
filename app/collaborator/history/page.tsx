"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBrazilianDate } from "@/utils/date-helpers"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface TimeEntry {
  id: string
  date: string
  hours_worked: number
  overtime_hours: number
  balance_hours: number // This is the change for THIS entry
  entry_type: string
  description: string | null
  created_at: string
}

export default function CollaboratorHistoryPage() {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSideSupabase()

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const sessionRes = await fetch("/api/auth/get-session")
        if (!sessionRes.ok) {
          toast({ title: "Erro", description: "Sessão expirada ou inválida. Por favor, faça login novamente." })
          router.push("/login")
          return
        }
        const sessionData = await sessionRes.json()

        if (sessionData.role !== "collaborator") {
          toast({ title: "Erro", description: "Acesso negado. Você não é um colaborador." })
          router.push("/login")
          return
        }

        const response = await fetch("/api/collaborator-history")
        if (response.ok) {
          const data = await response.json()
          setTimeEntries(data.timeEntries || [])
        } else {
          const errorData = await response.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar histórico de horas." })
          console.error("Error fetching collaborator history:", errorData)
        }
      } catch (error) {
        console.error("Erro ao buscar histórico de horas:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o histórico." })
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case "positive":
        return "Positivo"
      case "negative":
        return "Negativo"
      case "overtime":
        return "Extra"
      case "adjustment":
        return "Ajuste"
      default:
        return type
    }
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-green-600"
    if (balance < 0) return "text-red-600"
    return "text-gray-500"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando histórico...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl whitespace-normal">Histórico de Lançamentos de Horas</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/collaborator">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <p className="text-muted-foreground">Nenhum lançamento de horas encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Horas</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Impacto no Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{formatBrazilianDate(entry.date)}</TableCell>
                      <TableCell>{getEntryTypeLabel(entry.entry_type)}</TableCell>
                      <TableCell>{entry.hours_worked.toFixed(2)}</TableCell>
                      <TableCell className="max-w-[250px] truncate">{entry.description || "N/A"}</TableCell>
                      <TableCell className={`text-right font-semibold ${getBalanceColor(entry.balance_hours)}`}>
                        {entry.balance_hours > 0 ? "+" : ""}
                        {entry.balance_hours.toFixed(2)}
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

"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface CollaboratorReport {
  id: string
  full_name: string
  badge_number: string
  balance_hours: number
}

interface LeaderReportData {
  leaderName: string
  collaborators: CollaboratorReport[]
  totalPositiveHours: number
  totalNegativeHours: number
}

export default function LeaderReportPage() {
  const params = useParams()
  const leaderName = params.leaderName ? decodeURIComponent(params.leaderName as string) : ""
  const [reportData, setReportData] = useState<LeaderReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!leaderName) {
      setLoading(false)
      return
    }

    const fetchReport = async () => {
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
          toast({ title: "Erro", description: "Você não tem permissão para gerar relatórios." })
          router.push("/admin")
          return
        }

        const response = await fetch(`/api/admin/reports/leader/${encodeURIComponent(leaderName)}`)
        if (response.ok) {
          const data = await response.json()
          setReportData(data)
        } else {
          const errorData = await response.json()
          toast({ title: "Erro", description: errorData.error || "Falha ao carregar relatório." })
          console.error("Error fetching leader report:", errorData)
        }
      } catch (error) {
        console.error("Erro ao buscar relatório do líder:", error)
        toast({ title: "Erro", description: "Ocorreu um erro inesperado ao carregar o relatório." })
      } finally {
        setLoading(false)
      }
    }

    fetchReport()
  }, [leaderName, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando relatório...</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
        <Card className="w-full max-w-4xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-2xl">Relatório por Líder Direto</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Nenhum relatório encontrado para o líder &quot;{leaderName}&quot;.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const netBalance = reportData.totalPositiveHours + reportData.totalNegativeHours
  const netBalanceColor = netBalance > 0 ? "text-green-600" : netBalance < 0 ? "text-red-600" : "text-gray-500"

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-4xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Relatório de {reportData.leaderName}</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volta
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horas Positivas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{reportData.totalPositiveHours.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Horas Negativas Totais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{reportData.totalNegativeHours.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Saldo Líquido Total</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${netBalanceColor}`}>{netBalance.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          <h3 className="text-xl font-semibold mb-4">Colaboradores sob {reportData.leaderName}</h3>
          {reportData.collaborators.length === 0 ? (
            <p className="text-muted-foreground">Nenhum colaborador encontrado para este líder.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Crachá</TableHead>
                    <TableHead className="text-right">Saldo (horas)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.collaborators.map((collab) => (
                    <TableRow key={collab.id}>
                      <TableCell>{collab.full_name}</TableCell>
                      <TableCell>{collab.badge_number}</TableCell>
                      <TableCell
                        className={`text-right ${collab.balance_hours > 0 ? "text-green-600" : collab.balance_hours < 0 ? "text-red-600" : "text-gray-500"}`}
                      >
                        {collab.balance_hours.toFixed(2)}
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

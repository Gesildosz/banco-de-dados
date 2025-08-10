"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { createClientSideSupabase } from "@/lib/supabase-client"
import { InfoBannerSlider } from "@/components/info-banner-slider"

interface DashboardSummary {
  total_collaborators: number
  active_collaborators: number
  inactive_collaborators: number
  total_balance_hours: number
  pending_leave_requests: number
  pending_access_code_requests: number
}

interface CollaboratorSummary {
  id: string
  full_name: string
  badge_number: string
  balance_hours: number
  last_updated: string
}

interface Announcement {
  id: string
  title: string
  content: string
  created_at: string
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [collaborators, setCollaborators] = useState<CollaboratorSummary[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClientSideSupabase()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch session data
        const sessionRes = await fetch("/api/auth/get-session")
        const sessionData = await sessionRes.json()

        if (!sessionRes.ok || !sessionData.session || sessionData.session.userType !== "admin") {
          toast({
            title: "Erro",
            description: "Sessão inválida ou acesso negado. Por favor, faça login como administrador.",
          })
          router.push("/login")
          return
        }

        // Fetch Dashboard Summary
        const summaryRes = await fetch("/api/admin/dashboard-summary")
        if (!summaryRes.ok) {
          throw new Error(`HTTP error! status: ${summaryRes.status}`)
        }
        const summaryData = await summaryRes.json()
        setSummary(summaryData)

        // Fetch collaborators' balance hours
        const collaboratorsRes = await fetch("/api/admin/collaborators")
        if (!collaboratorsRes.ok) {
          throw new Error(`HTTP error! status: ${collaboratorsRes.status}`)
        }
        const collaboratorsData = await collaboratorsRes.json()
        setCollaborators(collaboratorsData)

        // Fetch announcements
        const announcementsRes = await fetch("/api/admin/announcement")
        if (!announcementsRes.ok) {
          throw new Error(`HTTP error! status: ${announcementsRes.status}`)
        }
        const announcementsData = await announcementsRes.json()
        setAnnouncements(announcementsData || []) // Ensure it's an array
      } catch (error: any) {
        console.error("Erro ao carregar dados do painel:", error)
        toast({ title: "Erro", description: error.message || "Falha ao carregar dados do painel." })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(error.message)
      }
      await fetch("/api/auth/logout", { method: "POST" }) // Clear server session
      toast({ title: "Sucesso", description: "Você foi desconectado." })
      router.push("/login")
    } catch (error: any) {
      console.error("Erro ao fazer logout:", error)
      toast({ title: "Erro", description: error.message || "Falha ao fazer logout." })
    } finally {
      setLoading(false)
    }
  }

  if (loading && !summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
        <p>Carregando painel do administrador...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 p-4 dark:bg-gray-950">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Painel do Administrador</h1>
        <Button onClick={handleLogout} disabled={loading}>
          Sair
        </Button>
      </header>

      <InfoBannerSlider />

      <main className="flex-1 space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Card de Resumo de Colaboradores */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Colaboradores</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total: {summary?.total_collaborators || 0}</p>
              <p className="text-green-600 dark:text-green-400">Ativos: {summary?.active_collaborators || 0}</p>
              <p className="text-red-600 dark:text-red-400">Inativos: {summary?.inactive_collaborators || 0}</p>
            </CardContent>
          </Card>

          {/* Card de Saldo Total de Horas */}
          <Card>
            <CardHeader>
              <CardTitle>Saldo Total de Horas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {summary?.total_balance_hours.toFixed(2) || "0.00"}h
              </p>
            </CardContent>
          </Card>

          {/* Card de Solicitações Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações Pendentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Folgas: {summary?.pending_leave_requests || 0}</p>
              <p>Códigos de Acesso: {summary?.pending_access_code_requests || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Card de Saldo de Horas dos Colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle>Saldo de Horas dos Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            {collaborators.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhum colaborador encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] table-auto">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Nome</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Crachá
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Saldo (h)
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                        Última Atualização
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {collaborators.map((collab) => (
                      <tr key={collab.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2 text-sm">{collab.full_name}</td>
                        <td className="px-4 py-2 text-sm">{collab.badge_number}</td>
                        <td className="px-4 py-2 text-sm">{collab.balance_hours.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm">
                          {format(new Date(collab.last_updated), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Anúncios Recentes */}
        <Card>
          <CardHeader>
            <CardTitle>Anúncios Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhum anúncio recente.</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="rounded-md border p-4">
                    <h3 className="text-lg font-semibold">{announcement.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(announcement.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                    <p className="mt-2 text-gray-700 dark:text-gray-300">{announcement.content}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

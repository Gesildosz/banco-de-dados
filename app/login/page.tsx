"use client"

import type React from "react"
import { KeyRound, User, Lock, BadgeIcon as IdCard } from "lucide-react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { InfoBannerSlider } from "@/components/info-banner-slider"

export default function LoginPage() {
  const [adminEmail, setAdminEmail] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [collaboratorBadgeNumber, setCollaboratorBadgeNumber] = useState("")
  const [collaboratorAccessCode, setCollaboratorAccessCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false) // New state for 2-step login
  const router = useRouter()

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      })
      const data = await response.json()
      if (response.ok) {
        toast({ title: "Sucesso", description: "Login de administrador bem-sucedido!" })
        router.push("/admin")
      } else {
        toast({ title: "Erro", description: data.error || "Falha no login de administrador." })
      }
    } catch (error) {
      console.error("Erro no login de administrador:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setLoading(false)
    }
  }

  const handleCollaboratorLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/collaborator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeNumber: collaboratorBadgeNumber,
          accessCode: showAccessCodeInput ? collaboratorAccessCode : undefined, // Only send if input is shown
        }),
      })
      const data = await response.json()

      if (response.ok) {
        if (data.needsAccessCodeSetup) {
          toast({ title: "Aviso", description: "Por favor, cadastre seu código de acesso." })
          router.push("/collaborator/setup-access-code")
        } else if (data.accessCodeRequired) {
          toast({ title: "Aviso", description: "Por favor, digite seu código de acesso." })
          setShowAccessCodeInput(true) // Show access code input
        } else {
          toast({ title: "Sucesso", description: "Login de colaborador bem-sucedido!" })
          router.push("/collaborator")
        }
      } else {
        toast({ title: "Erro", description: data.error || "Falha no login de colaborador." })
        setShowAccessCodeInput(false) // Reset if there's a general error
      }
    } catch (error: any) {
      console.error("Erro ao fazer login do colaborador:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
      setShowAccessCodeInput(false) // Reset on unexpected error
    } finally {
      setLoading(false)
    }
  }

  const handleBackToBadgeInput = () => {
    setShowAccessCodeInput(false)
    setCollaboratorAccessCode("")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 p-4">
      {/* Slider de Informações */}
      <InfoBannerSlider />

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Bem-vindo de volta!</CardTitle>
          <CardDescription>Faça login para acessar seu painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="collaborator" className="w-full">
            <TabsList className="grid w-full grid-cols-2 gap-2">
              {/* Tab Colaborador: Azul forte */}
              <TabsTrigger
                value="collaborator"
                className="
                  border border-blue-600
                  data-[state=active]:bg-blue-600 data-[state=active]:text-white
                  data-[state=inactive]:bg-blue-50 data-[state=inactive]:text-blue-700
                  hover:bg-blue-600/90 hover:text-white
                  transition-colors
                "
              >
                Colaborador
              </TabsTrigger>

              {/* Tab Administrador: Verde cana fluorescente */}
              <TabsTrigger
                value="admin"
                className="
                  border border-[#39FF14]
                  data-[state=active]:bg-[#39FF14] data-[state=active]:text-black
                  data-[state=inactive]:bg-[#eaffea] data-[state=inactive]:text-[#0c4d06]
                  hover:bg-[#2fd50f] hover:text-black
                  transition-colors
                "
              >
                Administrador
              </TabsTrigger>
            </TabsList>

            <TabsContent value="collaborator" className="mt-4 space-y-4">
              <form onSubmit={handleCollaboratorLogin}>
                <div className="space-y-2">
                  <Label htmlFor="badge-number">Número do Crachá</Label>
                  <div className="relative">
                    <IdCard
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      id="badge-number"
                      type="text"
                      placeholder="Digite seu número de crachá"
                      required
                      value={collaboratorBadgeNumber}
                      onChange={(e) => setCollaboratorBadgeNumber(e.target.value)}
                      className="pl-9"
                      autoComplete="off"
                      disabled={showAccessCodeInput} // Disable if access code input is shown
                    />
                  </div>
                </div>

                {showAccessCodeInput && (
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="access-code">Código de Acesso</Label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none"
                        aria-hidden="true"
                      />
                      <Input
                        id="access-code"
                        type="password"
                        placeholder="Digite seu código de acesso"
                        required
                        value={collaboratorAccessCode}
                        onChange={(e) => setCollaboratorAccessCode(e.target.value)}
                        className="pl-9"
                        autoComplete="current-password"
                      />
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white focus-visible:ring-blue-600"
                  disabled={loading}
                >
                  {loading ? "Carregando..." : showAccessCodeInput ? "Entrar" : "Continuar"}
                </Button>

                {showAccessCodeInput && (
                  <Button
                    type="button"
                    variant="link"
                    className="mt-2 w-full"
                    onClick={handleBackToBadgeInput}
                    disabled={loading}
                  >
                    Voltar
                  </Button>
                )}

                <div className="text-center text-sm mt-2">
                  <Link
                    href="/forgot-access-code"
                    className="text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    <KeyRound className="h-4 w-4" aria-hidden="true" />
                    <span>Esqueci meu código de acesso</span>
                  </Link>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-4 space-y-4">
              <form onSubmit={handleAdminLogin}>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <div className="relative">
                    <User
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Digite seu usuário"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="pl-9"
                      autoComplete="username"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 pointer-events-none"
                      aria-hidden="true"
                    />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="pl-9"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                {/* Botão de envio (Administrador): Verde cana fluorescente */}
                <Button
                  type="submit"
                  className="w-full bg-[#39FF14] hover:bg-[#2fd50f] text-black focus-visible:ring-[#39FF14]"
                  disabled={loading}
                >
                  {loading ? "Entrando..." : "Entrar como Administrador"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

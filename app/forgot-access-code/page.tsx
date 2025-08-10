"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"

export default function ForgotAccessCodePage() {
  const [badgeNumber, setBadgeNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch("/api/auth/forgot-access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeNumber }),
      })

      if (response.ok) {
        toast({
          title: "Solicitação Enviada",
          description:
            "Se o número do crachá estiver correto, seu código de acesso foi enviado para o seu contato registrado.",
        })
        router.push("/login") // Redirect back to login after request
      } else {
        const errorData = await response.json()
        toast({ title: "Erro", description: errorData.error || "Falha ao solicitar código de acesso." })
      }
    } catch (error) {
      console.error("Erro ao solicitar código de acesso:", error)
      toast({ title: "Erro", description: "Ocorreu um erro inesperado." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-950">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Esqueci meu Código de Acesso</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="badge-number">Número do Crachá</Label>
              <Input
                id="badge-number"
                type="text"
                placeholder="Digite seu número de crachá"
                required
                value={badgeNumber}
                onChange={(e) => setBadgeNumber(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Enviando..." : "Solicitar Código de Acesso"}
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Seu código de acesso será enviado para o contato registrado em nosso sistema.
            </p>
            <Alert className="mt-3 border-green-500/40 bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200">
              <ShieldCheck className="h-4 w-4" />
              <AlertTitle>Segurança</AlertTitle>
              <AlertDescription>
                Suas informações são protegidas. Confirmamos sua identidade e enviamos o código somente para o contato
                registrado. Nunca compartilhe seu código de acesso com terceiros.
              </AlertDescription>
            </Alert>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

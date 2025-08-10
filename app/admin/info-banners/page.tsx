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
import { ArrowLeft, ImageIcon, LinkIcon, ListOrdered } from "lucide-react"

interface InfoBanner {
  id: string
  image_url: string
  link_url: string | null
  order_index: number
  is_active: boolean
}

const MAX_BANNERS = 5

export default function ManageInfoBannersPage() {
  const [banners, setBanners] = useState<InfoBanner[]>([])
  const [loading, setLoading] = useState(true)
  const [newBanner, setNewBanner] = useState({
    image_url: "",
    link_url: "",
    order_index: 1,
    is_active: true,
  })
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBanner, setEditingBanner] = useState<InfoBanner | null>(null)
  const supabase = createClientSideSupabase()
  const router = useRouter()

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    setLoading(true)
    const response = await fetch("/api/admin/info-banners")
    if (response.ok) {
      const data = await response.json()
      setBanners(data.banners || [])
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao carregar banners." })
      console.error("Error fetching banners:", errorData)
      if (response.status === 401 || response.status === 403) {
        router.push("/login")
      }
    }
    setLoading(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewBanner((prev) => ({ ...prev, [id]: value }))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setNewBanner((prev) => ({ ...prev, [id]: Number(value) }))
  }

  const handleSwitchChange = (checked: boolean, field: keyof typeof newBanner) => {
    setNewBanner((prev) => ({ ...prev, [field]: checked }))
  }

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setEditingBanner((prev) => (prev ? { ...prev, [id]: value } : null))
  }

  const handleEditNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setEditingBanner((prev) => (prev ? { ...prev, [id]: Number(value) } : null))
  }

  const handleEditSwitchChange = (checked: boolean, field: keyof InfoBanner) => {
    setEditingBanner((prev) => (prev ? { ...prev, [field]: checked } : null))
  }

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    const response = await fetch("/api/admin/info-banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBanner),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Banner adicionado com sucesso!" })
      setNewBanner({
        image_url: "",
        link_url: "",
        order_index: 1,
        is_active: true,
      })
      setIsDialogOpen(false)
      fetchBanners()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao adicionar banner." })
      console.error("Error adding banner:", errorData)
    }
  }

  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBanner) return

    const { id, ...updates } = editingBanner
    const response = await fetch(`/api/admin/info-banners/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    })

    if (response.ok) {
      toast({ title: "Sucesso", description: "Banner atualizado com sucesso!" })
      setEditingBanner(null)
      setIsDialogOpen(false)
      fetchBanners()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao atualizar banner." })
      console.error("Error updating banner:", errorData)
    }
  }

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner?")) return
    const response = await fetch(`/api/admin/info-banners/${id}`, { method: "DELETE" })
    if (response.ok) {
      toast({ title: "Sucesso", description: "Banner excluído com sucesso!" })
      fetchBanners()
    } else {
      const errorData = await response.json()
      toast({ title: "Erro", description: errorData.error || "Falha ao excluir banner." })
      console.error("Error deleting banner:", errorData)
    }
  }

  const openEditDialog = (banner: InfoBanner) => {
    setEditingBanner(banner)
    setIsDialogOpen(true)
  }

  const availableOrderIndices = Array.from({ length: MAX_BANNERS }, (_, i) => i + 1).filter(
    (index) =>
      !banners.some((b) => b.order_index === index && b.id !== editingBanner?.id) ||
      index === editingBanner?.order_index,
  )

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4 dark:bg-gray-950">
      <Card className="w-full max-w-5xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Gerenciar Banners Informativos</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Link>
            </Button>
            <Button
              onClick={() => {
                setNewBanner({
                  image_url: "/placeholder.svg?height=180&width=400&text=Novo Banner", // Default placeholder
                  link_url: "",
                  order_index: availableOrderIndices[0] || 1, // Suggest first available order
                  is_active: true,
                })
                setEditingBanner(null)
                setIsDialogOpen(true)
              }}
              disabled={banners.length >= MAX_BANNERS}
            >
              Adicionar Novo Banner
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando banners...</p>
          ) : banners.length === 0 ? (
            <p className="text-muted-foreground">Nenhum banner informativo encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ordem</TableHead>
                    <TableHead>Imagem</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>{banner.order_index}</TableCell>
                      <TableCell>
                        <img
                          src={banner.image_url || "/placeholder.svg"}
                          alt={`Banner ${banner.order_index}`}
                          className="h-12 w-24 object-cover rounded-md"
                        />
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {banner.link_url ? (
                          <a
                            href={banner.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {banner.link_url}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={banner.is_active}
                          onCheckedChange={() =>
                            handleUpdateBanner({
                              ...banner,
                              is_active: !banner.is_active,
                            } as any)
                          } // Cast to any to simplify, as this is a partial update
                          aria-label={`Toggle active status for banner ${banner.order_index}`}
                        />
                        <span className="ml-2 text-sm">{banner.is_active ? "Sim" : "Não"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="mr-2 bg-transparent"
                          onClick={() => openEditDialog(banner)}
                        >
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteBanner(banner.id)}>
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
            <DialogTitle>{editingBanner ? "Editar Banner" : "Adicionar Novo Banner"}</DialogTitle>
            <DialogDescription>
              {editingBanner
                ? "Faça alterações nos detalhes do banner aqui."
                : `Preencha os detalhes para adicionar um novo banner (máximo ${MAX_BANNERS}).`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingBanner ? handleUpdateBanner : handleAddBanner} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image_url" className="text-right">
                <ImageIcon className="h-4 w-4 inline-block mr-1" /> URL da Imagem
              </Label>
              <Input
                id="image_url"
                value={editingBanner?.image_url || newBanner.image_url}
                onChange={editingBanner ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                placeholder="/placeholder.svg?height=180&width=400&text=Seu Banner"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="link_url" className="text-right">
                <LinkIcon className="h-4 w-4 inline-block mr-1" /> URL do Link (Opcional)
              </Label>
              <Input
                id="link_url"
                value={editingBanner?.link_url || newBanner.link_url || ""}
                onChange={editingBanner ? handleEditInputChange : handleInputChange}
                className="col-span-3"
                placeholder="https://seusite.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="order_index" className="text-right">
                <ListOrdered className="h-4 w-4 inline-block mr-1" /> Ordem
              </Label>
              <Input
                id="order_index"
                type="number"
                value={editingBanner?.order_index || newBanner.order_index}
                onChange={editingBanner ? handleEditNumberInputChange : handleNumberInputChange}
                className="col-span-3"
                min={1}
                max={MAX_BANNERS}
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is_active" className="text-right">
                Ativo
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={editingBanner?.is_active ?? newBanner.is_active}
                  onCheckedChange={(checked) =>
                    editingBanner
                      ? handleEditSwitchChange(checked as boolean, "is_active")
                      : handleSwitchChange(checked as boolean, "is_active")
                  }
                />
                <Label htmlFor="is_active">{(editingBanner?.is_active ?? newBanner.is_active) ? "Sim" : "Não"}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">{editingBanner ? "Salvar Alterações" : "Adicionar Banner"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

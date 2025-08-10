import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET() {
  const supabase = createServerClient()

  try {
    const { data: banners, error } = await supabase
      .from("info_banners")
      .select("image_url, link_url")
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Erro ao buscar banners informativos públicos:", error.message, error.details ?? "")
      // Return empty array so login page keeps working
      return NextResponse.json({ banners: [] }, { status: 200 })
    }

    return NextResponse.json({ banners: banners ?? [] })
  } catch (error: any) {
    console.error("Erro interno do servidor ao buscar banners informativos públicos:", error?.message || error)
    // Return empty array so login page keeps working
    return NextResponse.json({ banners: [] }, { status: 200 })
  }
}

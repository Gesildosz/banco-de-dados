"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface InfoBanner {
  image_url: string
  link_url: string | null
}

export function InfoBannerSlider() {
  const [banners, setBanners] = useState<InfoBanner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/info-banners")
        if (response.ok) {
          const data = await response.json()
          setBanners(data.banners)
        } else {
          console.error("Falha ao carregar banners:", await response.json())
        }
      } catch (error) {
        console.error("Erro ao buscar banners:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
      }, 3000) // Change every 3 seconds
      return () => clearInterval(interval)
    }
  }, [banners])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length)
  }

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg shadow-md mb-6">
        <p className="text-gray-600 dark:text-gray-400">Carregando banners...</p>
      </div>
    )
  }

  if (banners.length === 0) {
    return null // Don't render if no banners are available
  }

  const currentBanner = banners[currentIndex]

  const BannerContent = () => (
    <div className="relative w-full h-48 overflow-hidden rounded-lg">
      <Image
        src={currentBanner.image_url || "/placeholder.svg"}
        alt={`Banner ${currentIndex + 1}`}
        fill
        style={{ objectFit: "cover" }}
        className="rounded-lg"
        priority // Prioritize loading for better UX on login page
      />
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={goToPrevious}
            aria-label="Previous banner"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full"
            onClick={goToNext}
            aria-label="Next banner"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
        {banners.map((_, index) => (
          <span
            key={index}
            className={`block h-2 w-2 rounded-full ${
              index === currentIndex ? "bg-white" : "bg-gray-400/70"
            } cursor-pointer`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )

  return (
    <Card className="w-full max-w-md mb-6 bg-gray-200 dark:bg-gray-900 border-none shadow-none">
      <CardContent className="p-0">
        {currentBanner.link_url ? (
          <Link href={currentBanner.link_url} target="_blank" rel="noopener noreferrer">
            <BannerContent />
          </Link>
        ) : (
          <BannerContent />
        )}
      </CardContent>
    </Card>
  )
}

import { useRef, useEffect, useState } from 'react'
import { View, Text, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import BarcodeOverlay from './BarcodeOverlay'

const BARCODE_FORMATS = ['ean_13', 'ean_8', 'upc_a']

type Props = {
  onBarcodeScanned: (barcode: string) => void
}

export default function WebScanner({ onBarcodeScanned }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [supported, setSupported] = useState<boolean | null>(null)

  useEffect(() => {
    setSupported('BarcodeDetector' in window)
  }, [])

  useEffect(() => {
    if (!supported) return

    let stream: MediaStream | undefined
    let animId: number
    let active = true

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (!videoRef.current || !active) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // Attendre que la vidéo ait suffisamment de données (important en PWA)
        await new Promise<void>((resolve) => {
          const video = videoRef.current!
          if (video.readyState >= 2) {
            resolve()
          } else {
            video.addEventListener('loadeddata', () => resolve(), { once: true })
          }
        })

        if (!active) return

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: BARCODE_FORMATS })

        const scan = async () => {
          if (!videoRef.current || !active) return
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const codes: any[] = await detector.detect(videoRef.current)
            if (codes.length > 0) {
              active = false
              onBarcodeScanned(codes[0].rawValue)
              return
            }
          } catch {
            // detection frame error — continue
          }
          animId = requestAnimationFrame(scan)
        }
        animId = requestAnimationFrame(scan)
      } catch {
        setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.")
      }
    }

    start()

    return () => {
      active = false
      cancelAnimationFrame(animId)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [onBarcodeScanned, supported])

  if (supported === null) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />
  }

  if (!supported) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-8">
        <Text className="text-white text-lg font-bold mb-3 text-center">
          Scanner non disponible sur ce navigateur
        </Text>
        <Text className="text-[#6B5E5E] text-sm text-center mb-6">
          Utilisez Chrome sur Android pour scanner, ou téléchargez l'application mobile.
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-amber-500">Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (cameraError) {
    return (
      <View className="flex-1 bg-[#0E0B0B] items-center justify-center px-8">
        <Text className="text-white text-lg font-bold mb-3 text-center">{cameraError}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-amber-500">Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* @ts-expect-error — video est un élément HTML valide en contexte web */}
      <video
        ref={videoRef}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        playsInline
        muted
      />
      <BarcodeOverlay />
      <View className="absolute bottom-12 w-full items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-white text-lg">Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

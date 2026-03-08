import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useBarcodeScan } from '@/hooks/useBarcodeScan'
import { addItem } from '@/lib/firestore'
import { useAuthStore } from '@/stores/authStore'
import BarcodeOverlay from '@/components/scan/BarcodeOverlay'

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const { result, error, isLoading, onBarcodeScanned, reset } = useBarcodeScan()
  const uid = useAuthStore((s) => s.uid)

  if (!permission) {
    return <View className="flex-1 bg-black" />
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text className="text-white text-lg text-center mb-4">
          Cinook a besoin d'accéder à la caméra pour scanner les codes-barres.
        </Text>
        <TouchableOpacity
          className="bg-amber-500 px-6 py-3 rounded-lg mb-4"
          onPress={requestPermission}
        >
          <Text className="text-black font-semibold">Autoriser la caméra</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-gray-400">Annuler</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const handleAdd = async () => {
    if (!result || !uid) return
    await addItem(uid, {
      title: result.title,
      type: result.type,
      poster: result.poster,
      synopsis: result.synopsis,
      director: result.director,
      author: result.author,
      year: result.year,
      tmdbId: result.tmdbId,
      googleBooksId: result.googleBooksId,
      isbn: result.isbn,
      status: 'owned',
      tier: 'none',
      addedVia: 'scan',
    })
    router.back()
  }

  if (error) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <Text className="text-white text-lg text-center mb-2">Code non reconnu — saisie manuelle ?</Text>
        <Text className="text-gray-400 text-sm text-center mb-8">
          Ce code-barres n'a pas été trouvé dans nos bases de données.
        </Text>
        <TouchableOpacity
          className="bg-amber-500 px-6 py-3 rounded-lg mb-4"
          onPress={() => router.push('/item/new')}
        >
          <Text className="text-black font-semibold">Saisie manuelle</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reset} className="py-3">
          <Text className="text-gray-400">Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (result) {
    return (
      <View className="flex-1 bg-black px-6 pt-16">
        <Text className="text-white text-2xl font-bold mb-4 text-center">{result.title}</Text>
        {result.poster && (
          <Image
            source={{ uri: result.poster }}
            className="w-40 h-60 rounded-lg mb-4 self-center"
            resizeMode="cover"
          />
        )}
        {result.year && (
          <Text className="text-gray-400 text-center mb-1">{result.year}</Text>
        )}
        {result.author && (
          <Text className="text-gray-300 text-center mb-1">{result.author}</Text>
        )}
        {result.synopsis && (
          <Text className="text-gray-300 text-sm text-center mb-6 px-2" numberOfLines={3}>
            {result.synopsis}
          </Text>
        )}
        <TouchableOpacity
          className="bg-amber-500 py-4 rounded-xl mb-3"
          onPress={handleAdd}
        >
          <Text className="text-black font-bold text-center text-lg">
            Ajouter à ma collection
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={reset} className="py-3">
          <Text className="text-gray-400 text-center">Annuler</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-black">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f59e0b" />
          <Text className="text-white mt-4">Recherche en cours...</Text>
        </View>
      ) : (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a'] }}
          onBarcodeScanned={({ data }) => onBarcodeScanned(data)}
        >
          <BarcodeOverlay />
          <View className="absolute bottom-12 w-full items-center">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-white text-lg">Annuler</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      )}
    </View>
  )
}

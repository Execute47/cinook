import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native'
import { Timestamp } from 'firebase/firestore'
import type { MediaType } from '@/types/media'

const todayStr = () => {
  const d = new Date()
  return [
    String(d.getDate()).padStart(2, '0'),
    String(d.getMonth() + 1).padStart(2, '0'),
    d.getFullYear(),
  ].join('/')
}

const parseDate = (str: string): Date | null => {
  const parts = str.split('/')
  if (parts.length !== 3) return null
  const [dd, mm, yyyy] = parts.map(Number)
  if ([dd, mm, yyyy].some(isNaN)) return null
  const d = new Date(yyyy, mm - 1, dd)
  return isNaN(d.getTime()) ? null : d
}

interface Props {
  visible: boolean
  type: MediaType
  initialEndedAt?: Timestamp
  initialStartedAt?: Timestamp
  onValidate: (endedAt: Timestamp, startedAt?: Timestamp) => void
  onCancel: () => void
}

export default function WatchDateModal({
  visible, type, initialEndedAt, initialStartedAt, onValidate, onCancel,
}: Props) {
  const [endedStr, setEndedStr] = useState(todayStr())
  const [startedStr, setStartedStr] = useState('')

  useEffect(() => {
    if (visible) {
      setEndedStr(
        initialEndedAt ? initialEndedAt.toDate().toLocaleDateString('fr-FR') : todayStr()
      )
      setStartedStr(
        initialStartedAt ? initialStartedAt.toDate().toLocaleDateString('fr-FR') : ''
      )
    }
  }, [visible])

  const parsedEnded = parseDate(endedStr)
  const parsedStarted = startedStr.trim() ? parseDate(startedStr) : null
  const canValidate = parsedEnded !== null

  const reset = () => {
    setEndedStr(todayStr())
    setStartedStr('')
  }

  const handleValidate = () => {
    if (!canValidate || !parsedEnded) return
    const endedAt = Timestamp.fromDate(parsedEnded)
    const startedAt = parsedStarted ? Timestamp.fromDate(parsedStarted) : undefined
    onValidate(endedAt, startedAt)
    reset()
  }

  const handleCancel = () => {
    reset()
    onCancel()
  }

  const title =
    type === 'film' ? 'Date de visionnage'
    : type === 'serie' ? 'Dates de visionnage'
    : 'Dates de lecture'
  const endedLabel = type === 'film' ? 'Vu le' : 'Terminé le'

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-xl p-6 w-full">
          <Text className="text-white text-lg font-bold mb-4">{title}</Text>

          {type !== 'film' && (
            <>
              <Text className="text-[#6B5E5E] text-sm mb-1">Commencé le (optionnel)</Text>
              <TextInput
                value={startedStr}
                onChangeText={setStartedStr}
                placeholder="jj/mm/aaaa"
                placeholderTextColor="#6B5E5E"
                className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
              />
            </>
          )}

          <Text className="text-[#6B5E5E] text-sm mb-1">{endedLabel} *</Text>
          <TextInput
            value={endedStr}
            onChangeText={setEndedStr}
            placeholder="jj/mm/aaaa"
            placeholderTextColor="#6B5E5E"
            className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-6"
          />

          <View className="flex-row gap-3 justify-end">
            <TouchableOpacity onPress={handleCancel} className="px-4 py-2">
              <Text className="text-[#6B5E5E]">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleValidate}
              disabled={!canValidate}
              className={`px-4 py-2 rounded-lg ${canValidate ? 'bg-amber-500' : 'bg-[#3D3535]'}`}
            >
              <Text className={`font-semibold ${canValidate ? 'text-black' : 'text-[#6B5E5E]'}`}>
                Valider
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

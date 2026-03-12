import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Timestamp } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'
import type { MediaType } from '@/types/media'

interface Props {
  visible: boolean
  type: MediaType
  initialEndedAt?: Timestamp
  initialStartedAt?: Timestamp
  onValidate: (endedAt?: Timestamp, startedAt?: Timestamp) => void
  onCancel: () => void
}

type PickerMode = 'none' | 'started' | 'ended'

export default function WatchDateModal({
  visible, type, initialEndedAt, initialStartedAt, onValidate, onCancel,
}: Props) {
  const [endedDate, setEndedDate] = useState<Date | null>(null)
  const [startedDate, setStartedDate] = useState<Date | null>(null)
  const [pickerMode, setPickerMode] = useState<PickerMode>('none')

  useEffect(() => {
    if (visible) {
      setEndedDate(initialEndedAt ? initialEndedAt.toDate() : new Date())
      setStartedDate(initialStartedAt ? initialStartedAt.toDate() : null)
    }
  }, [visible, initialEndedAt, initialStartedAt])

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    // Sur Android, on ferme le picker dès qu'une action est faite
    if (Platform.OS === 'android') {
      setPickerMode('none')
    }

    if (event.type === 'set' && selectedDate) {
      if (pickerMode === 'started') {
        setStartedDate(selectedDate)
      } else if (pickerMode === 'ended') {
        setEndedDate(selectedDate)
      }
    }
  }

  const handleValidate = () => {
    const endedAt = endedDate ? Timestamp.fromDate(endedDate) : undefined
    const startedAt = startedDate ? Timestamp.fromDate(startedDate) : undefined
    onValidate(endedAt, startedAt)
  }

  const title =
    type === 'film' ? 'Date de visionnage'
    : type === 'serie' ? 'Dates de visionnage'
    : 'Dates de lecture'
  const endedLabel = type === 'film' ? 'Vu le' : 'Terminé le'

  const formatDate = (date: Date | null) => {
    if (!date) return 'Non renseigné'
    return date.toLocaleDateString('fr-FR')
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-xl p-6 w-full">
          <Text className="text-white text-lg font-bold mb-6 text-center">{title}</Text>

          {type !== 'film' && (
            <View className="mb-4">
              <Text className="text-[#6B5E5E] text-sm mb-2">Commencé le</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setPickerMode('started')}
                  className="flex-1 bg-[#0E0B0B] border border-[#3D3535] rounded-lg px-4 py-3 flex-row items-center justify-between"
                >
                  <Text className={startedDate ? 'text-white' : 'text-amber-500/50 italic'}>
                    {formatDate(startedDate)}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={startedDate ? '#6B5E5E' : '#FBBF24'} />
                </TouchableOpacity>
                {startedDate ? (
                  <TouchableOpacity
                    onPress={() => setStartedDate(null)}
                    className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-[#3D3535]"
                  >
                    <Ionicons name="close-outline" size={24} color="#6B5E5E" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => setStartedDate(new Date())}
                    className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-amber-500/30"
                  >
                    <Ionicons name="add-outline" size={24} color="#FBBF24" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          <View className="mb-8">
            <Text className="text-[#6B5E5E] text-sm mb-2">{endedLabel}</Text>
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => setPickerMode('ended')}
                className="flex-1 bg-[#0E0B0B] border border-[#3D3535] rounded-lg px-4 py-3 flex-row items-center justify-between"
              >
                <Text className={endedDate ? 'text-white' : 'text-amber-500/50 italic'}>
                  {formatDate(endedDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color={endedDate ? '#6B5E5E' : '#FBBF24'} />
              </TouchableOpacity>
              {endedDate ? (
                <TouchableOpacity
                  onPress={() => setEndedDate(null)}
                  className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-[#3D3535]"
                >
                  <Ionicons name="close-outline" size={24} color="#6B5E5E" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => setEndedDate(new Date())}
                  className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-amber-500/30"
                >
                  <Ionicons name="add-outline" size={24} color="#FBBF24" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {pickerMode !== 'none' && (
            Platform.OS === 'web' ? (
              // Simple simulation pour le web si nécessaire, mais le DateTimePicker
              // devrait fonctionner. On peut aussi utiliser un input date masqué.
              <DateTimePicker
                value={pickerMode === 'started' ? (startedDate || new Date()) : (endedDate || new Date())}
                mode="date"
                display="default"
                onChange={handleDateChange}
              />
            ) : (
              <DateTimePicker
                value={pickerMode === 'started' ? (startedDate || new Date()) : (endedDate || new Date())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                textColor="white"
              />
            )
          )}

          <View className="flex-row gap-3 justify-end">
            <TouchableOpacity onPress={onCancel} className="px-4 py-2">
              <Text className="text-[#6B5E5E]">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleValidate}
              className="px-6 py-2 rounded-lg bg-amber-500"
            >
              <Text className="font-semibold text-black">Valider</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

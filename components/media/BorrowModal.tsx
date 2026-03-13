import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Timestamp } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  visible: boolean
  onValidate: (borrowedFrom: string, borrowDate?: Timestamp) => void
  onCancel: () => void
}

export default function BorrowModal({ visible, onValidate, onCancel }: Props) {
  const [lender, setLender] = useState('')
  const [borrowDate, setBorrowDate] = useState<Date | null>(new Date())
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (visible) {
      setBorrowDate(new Date())
      setLender('')
    }
  }, [visible])

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
    if (event.type === 'set' && selectedDate) {
      setBorrowDate(selectedDate)
    }
  }

  const handleValidate = () => {
    if (!lender.trim()) return
    onValidate(lender.trim(), borrowDate ? Timestamp.fromDate(borrowDate) : undefined)
  }

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
          <Text className="text-white text-lg font-bold mb-4">Enregistrer l'emprunt</Text>

          <Text className="text-[#6B5E5E] text-sm mb-1">Emprunté à *</Text>
          <TextInput
            value={lender}
            onChangeText={setLender}
            placeholder="Nom du prêteur"
            placeholderTextColor="#6B5E5E"
            className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
          />

          <Text className="text-[#6B5E5E] text-sm mb-1">Date de l'emprunt</Text>
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="flex-1 bg-[#0E0B0B] border border-[#3D3535] rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={borrowDate ? 'text-white' : 'text-[#6B5E5E]'}>
                {formatDate(borrowDate)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6B5E5E" />
            </TouchableOpacity>
            {borrowDate && (
              <TouchableOpacity
                onPress={() => setBorrowDate(null)}
                className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-[#3D3535]"
              >
                <Ionicons name="close-outline" size={24} color="#6B5E5E" />
              </TouchableOpacity>
            )}
          </View>

          {showPicker && (
            <DateTimePicker
              value={borrowDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              textColor="white"
            />
          )}

          <View className="flex-row gap-3 justify-end">
            <TouchableOpacity onPress={onCancel} className="px-4 py-2">
              <Text className="text-[#6B5E5E]">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleValidate}
              disabled={!lender.trim()}
              className={`px-6 py-2 rounded-lg ${lender.trim() ? 'bg-amber-500' : 'bg-[#3D3535]'}`}
            >
              <Text className={`font-semibold ${lender.trim() ? 'text-black' : 'text-[#6B5E5E]'}`}>
                Valider
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

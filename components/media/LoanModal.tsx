import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, Platform } from 'react-native'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Timestamp } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  visible: boolean
  onValidate: (loanTo: string, loanDate?: Timestamp) => void
  onCancel: () => void
}

export default function LoanModal({ visible, onValidate, onCancel }: Props) {
  const [borrower, setBorrower] = useState('')
  const [loanDate, setLoanDate] = useState<Date | null>(new Date())
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    if (visible) {
      setLoanDate(new Date())
      setBorrower('')
    }
  }, [visible])

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false)
    }
    if (event.type === 'set' && selectedDate) {
      setLoanDate(selectedDate)
    }
  }

  const handleValidate = () => {
    if (!borrower.trim()) return
    onValidate(borrower.trim(), loanDate ? Timestamp.fromDate(loanDate) : undefined)
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
          <Text className="text-white text-lg font-bold mb-4">Enregistrer le prêt</Text>

          <Text className="text-[#6B5E5E] text-sm mb-1">Prêté à *</Text>
          <TextInput
            value={borrower}
            onChangeText={setBorrower}
            placeholder="Nom de l'emprunteur"
            placeholderTextColor="#6B5E5E"
            className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
          />

          <Text className="text-[#6B5E5E] text-sm mb-1">Date du prêt</Text>
          <View className="flex-row gap-2 mb-6">
            <TouchableOpacity
              onPress={() => setShowPicker(true)}
              className="flex-1 bg-[#0E0B0B] border border-[#3D3535] rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={loanDate ? 'text-white' : 'text-[#6B5E5E]'}>
                {formatDate(loanDate)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6B5E5E" />
            </TouchableOpacity>
            {loanDate && (
              <TouchableOpacity
                onPress={() => setLoanDate(null)}
                className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-[#3D3535]"
              >
                <Ionicons name="close-outline" size={24} color="#6B5E5E" />
              </TouchableOpacity>
            )}
          </View>

          {showPicker && (
            <DateTimePicker
              value={loanDate || new Date()}
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
              disabled={!borrower.trim()}
              className={`px-6 py-2 rounded-lg ${borrower.trim() ? 'bg-amber-500' : 'bg-[#3D3535]'}`}
            >
              <Text className={`font-semibold ${borrower.trim() ? 'text-black' : 'text-[#6B5E5E]'}`}>
                Valider
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

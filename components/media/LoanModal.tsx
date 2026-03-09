import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native'
import { Timestamp } from 'firebase/firestore'

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
  onValidate: (loanTo: string, loanDate: Timestamp) => void
  onCancel: () => void
}

export default function LoanModal({ visible, onValidate, onCancel }: Props) {
  const [borrower, setBorrower] = useState('')
  const [dateStr, setDateStr] = useState(todayStr())

  const parsedDate = parseDate(dateStr)
  const canValidate = borrower.trim().length > 0 && parsedDate !== null

  const reset = () => {
    setBorrower('')
    setDateStr(todayStr())
  }

  const handleValidate = () => {
    if (!canValidate || !parsedDate) return
    onValidate(borrower.trim(), Timestamp.fromDate(parsedDate))
    reset()
  }

  const handleCancel = () => {
    reset()
    onCancel()
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
          <TextInput
            value={dateStr}
            onChangeText={setDateStr}
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

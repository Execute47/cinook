import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity } from 'react-native'

interface Props {
  value: string | undefined
  onSave: (comment: string) => void
  onClear: () => void
}

export default function CommentInput({ value, onSave, onClear }: Props) {
  const [text, setText] = useState(value ?? '')
  const isDirty = text !== (value ?? '')

  return (
    <View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ton avis..."
        placeholderTextColor="#6B5E5E"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3"
        style={{ minHeight: 80 }}
      />
      <View className="flex-row gap-3 mt-2">
        {isDirty && (
          <TouchableOpacity onPress={() => onSave(text)} className="bg-amber-500 px-4 py-2 rounded-lg">
            <Text className="text-black font-semibold text-sm">Enregistrer</Text>
          </TouchableOpacity>
        )}
        {(value || text) && (
          <TouchableOpacity onPress={() => { setText(''); onClear() }} className="py-2">
            <Text className="text-[#6B5E5E] text-sm">✕ Effacer</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

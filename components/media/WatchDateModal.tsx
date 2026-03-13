import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Modal, Platform, TextInput } from 'react-native'
import DateTimePicker, { DateTimePickerEvent, DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Timestamp } from 'firebase/firestore'
import { Ionicons } from '@expo/vector-icons'
import type { MediaType, DatePrecision } from '@/types/media'
import { formatPartialDate } from '@/lib/dateUtils'

interface Props {
  visible: boolean
  type: MediaType
  initialEndedAt?: Timestamp
  initialStartedAt?: Timestamp
  initialEndedAtPrecision?: DatePrecision
  initialStartedAtPrecision?: DatePrecision
  onValidate: (
    endedAt?: Timestamp,
    startedAt?: Timestamp,
    endedAtPrecision?: DatePrecision,
    startedAtPrecision?: DatePrecision,
  ) => void
  onCancel: () => void
}

type PickerField = 'started' | 'ended'

const PRECISION_OPTIONS: { value: DatePrecision; label: string }[] = [
  { value: 'year', label: 'Année' },
  { value: 'month', label: 'Mois' },
  { value: 'day', label: 'Date' },
]

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function buildDateFromPartial(year: number, month: number, precision: DatePrecision): Date {
  if (precision === 'year') return new Date(year, 0, 1)
  if (precision === 'month') return new Date(year, month, 1)
  return new Date(year, month, 1)
}

export default function WatchDateModal({
  visible, type,
  initialEndedAt, initialStartedAt,
  initialEndedAtPrecision, initialStartedAtPrecision,
  onValidate, onCancel,
}: Props) {
  const [endedDate, setEndedDate] = useState<Date | null>(null)
  const [startedDate, setStartedDate] = useState<Date | null>(null)
  const [endedPrecision, setEndedPrecision] = useState<DatePrecision>('day')
  const [startedPrecision, setStartedPrecision] = useState<DatePrecision>('day')

  // Champs pour saisie partielle
  const [endedYear, setEndedYear] = useState('')
  const [endedMonth, setEndedMonth] = useState(0)
  const [startedYear, setStartedYear] = useState('')
  const [startedMonth, setStartedMonth] = useState(0)

  // iOS inline picker
  const [iosPickerField, setIosPickerField] = useState<PickerField | null>(null)

  useEffect(() => {
    if (visible) {
      const now = new Date()

      const ep = initialEndedAtPrecision ?? 'day'
      const sp = initialStartedAtPrecision ?? 'day'
      setEndedPrecision(ep)
      setStartedPrecision(sp)

      if (initialEndedAt) {
        const d = initialEndedAt.toDate()
        setEndedDate(d)
        setEndedYear(d.getFullYear().toString())
        setEndedMonth(d.getMonth())
      } else {
        setEndedDate(now)
        setEndedYear(now.getFullYear().toString())
        setEndedMonth(now.getMonth())
      }

      if (initialStartedAt) {
        const d = initialStartedAt.toDate()
        setStartedDate(d)
        setStartedYear(d.getFullYear().toString())
        setStartedMonth(d.getMonth())
      } else {
        setStartedDate(null)
        setStartedYear(now.getFullYear().toString())
        setStartedMonth(now.getMonth())
      }

      setIosPickerField(null)
    }
  }, [visible, initialEndedAt, initialStartedAt, initialEndedAtPrecision, initialStartedAtPrecision])

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date, field?: PickerField) => {
    setIosPickerField(null)
    if (event.type === 'set' && selectedDate) {
      if (field === 'started') {
        setStartedDate(selectedDate)
        setStartedYear(selectedDate.getFullYear().toString())
        setStartedMonth(selectedDate.getMonth())
      } else {
        setEndedDate(selectedDate)
        setEndedYear(selectedDate.getFullYear().toString())
        setEndedMonth(selectedDate.getMonth())
      }
    }
  }

  const openPicker = (field: PickerField) => {
    const currentDate = field === 'started' ? (startedDate ?? new Date()) : (endedDate ?? new Date())

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: currentDate,
        mode: 'date',
        onChange: (event, date) => handleDateChange(event, date, field),
      })
    } else {
      setIosPickerField(field)
    }
  }

  const buildDateForField = (
    field: PickerField,
    precision: DatePrecision,
    yearStr: string,
    month: number,
    fullDate: Date | null,
  ): Date | null => {
    if (field === 'ended' && !endedDate && precision === 'day') return null
    if (field === 'started' && !startedDate) return null

    if (precision === 'year') {
      const y = parseInt(yearStr, 10)
      if (isNaN(y)) return null
      return new Date(y, 0, 1)
    }
    if (precision === 'month') {
      const y = parseInt(yearStr, 10)
      if (isNaN(y)) return null
      return new Date(y, month, 1)
    }
    return fullDate
  }

  const handleValidate = () => {
    const eDate = buildDateForField('ended', endedPrecision, endedYear, endedMonth, endedDate)
    const sDate = startedDate
      ? buildDateForField('started', startedPrecision, startedYear, startedMonth, startedDate)
      : null

    const endedAt = eDate ? Timestamp.fromDate(eDate) : undefined
    const startedAt = sDate ? Timestamp.fromDate(sDate) : undefined
    const endedAtPrecision: DatePrecision | undefined = eDate ? endedPrecision : undefined
    const startedAtPrecision: DatePrecision | undefined = sDate ? startedPrecision : undefined

    onValidate(endedAt, startedAt, endedAtPrecision, startedAtPrecision)
  }

  const title =
    type === 'film' ? 'Date de visionnage'
    : type === 'serie' ? 'Dates de visionnage'
    : 'Dates de lecture'
  const endedLabel = type === 'film' ? 'Vu le' : 'Terminé le'

  const renderPrecisionSelector = (
    precision: DatePrecision,
    onChange: (p: DatePrecision) => void,
  ) => (
    <View className="flex-row gap-2 mb-3">
      {PRECISION_OPTIONS.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => onChange(opt.value)}
          className={`flex-1 py-1.5 rounded-lg items-center border ${
            precision === opt.value
              ? 'bg-amber-500 border-amber-500'
              : 'bg-[#0E0B0B] border-[#3D3535]'
          }`}
        >
          <Text className={`text-xs font-medium ${precision === opt.value ? 'text-black' : 'text-[#6B5E5E]'}`}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )

  const renderYearInput = (
    yearStr: string,
    setYear: (y: string) => void,
  ) => (
    <TextInput
      value={yearStr}
      onChangeText={setYear}
      keyboardType="numeric"
      maxLength={4}
      placeholder="ex: 2023"
      placeholderTextColor="#6B5E5E"
      className="flex-1 bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3"
    />
  )

  const renderMonthSelector = (
    yearStr: string,
    setYear: (y: string) => void,
    month: number,
    setMonth: (m: number) => void,
  ) => (
    <View className="gap-2">
      <TextInput
        value={yearStr}
        onChangeText={setYear}
        keyboardType="numeric"
        maxLength={4}
        placeholder="Année (ex: 2023)"
        placeholderTextColor="#6B5E5E"
        className="bg-[#0E0B0B] text-white border border-[#3D3535] rounded-lg px-4 py-3"
      />
      <View className="flex-row flex-wrap gap-1">
        {MONTHS_FR.map((m, i) => (
          <TouchableOpacity
            key={m}
            onPress={() => setMonth(i)}
            className={`px-2 py-1 rounded border ${
              month === i ? 'bg-amber-500 border-amber-500' : 'bg-[#0E0B0B] border-[#3D3535]'
            }`}
          >
            <Text className={`text-xs ${month === i ? 'text-black font-semibold' : 'text-[#6B5E5E]'}`}>
              {m.substring(0, 3)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderDateField = (
    field: PickerField,
    label: string,
    date: Date | null,
    setDate: (d: Date | null) => void,
    precision: DatePrecision,
    setPrecision: (p: DatePrecision) => void,
    yearStr: string,
    setYear: (y: string) => void,
    month: number,
    setMonth: (m: number) => void,
    optional = false,
  ) => {
    const displayDate = date
      ? formatPartialDate(
          precision === 'year' ? new Date(parseInt(yearStr, 10) || new Date().getFullYear(), 0, 1)
          : precision === 'month' ? new Date(parseInt(yearStr, 10) || new Date().getFullYear(), month, 1)
          : date,
          precision,
        )
      : 'Non renseigné'

    return (
      <View className="mb-4">
        <Text className="text-[#6B5E5E] text-sm mb-2">{label}</Text>
        {renderPrecisionSelector(precision, setPrecision)}

        {precision === 'day' && Platform.OS !== 'web' && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                if (!date) setDate(new Date())
                openPicker(field)
              }}
              className="flex-1 bg-[#0E0B0B] border border-[#3D3535] rounded-lg px-4 py-3 flex-row items-center justify-between"
            >
              <Text className={date ? 'text-white' : 'text-amber-500/50 italic'}>
                {displayDate}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={date ? '#6B5E5E' : '#FBBF24'} />
            </TouchableOpacity>
            {date ? (
              <TouchableOpacity
                onPress={() => setDate(null)}
                className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-[#3D3535]"
              >
                <Ionicons name="close-outline" size={24} color="#6B5E5E" />
              </TouchableOpacity>
            ) : optional ? (
              <TouchableOpacity
                onPress={() => setDate(new Date())}
                className="bg-[#2A2222] px-3 rounded-lg items-center justify-center border border-amber-500/30"
              >
                <Ionicons name="add-outline" size={24} color="#FBBF24" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {precision === 'year' && (
          <View className="flex-row gap-2 items-center">
            {renderYearInput(yearStr, setYear)}
          </View>
        )}

        {precision === 'month' && renderMonthSelector(yearStr, setYear, month, setMonth)}

        {/* Web : input[type=date] natif */}
        {Platform.OS === 'web' && precision === 'day' && (
          // @ts-expect-error — HTML element valide en React Native Web
          <input
            type="date"
            value={date ? date.toISOString().split('T')[0] : ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const val = e.target.value
              if (val) {
                const [y, m, d] = val.split('-').map(Number)
                const newDate = new Date(y, m - 1, d)
                if (field === 'started') {
                  setStartedDate(newDate)
                  setStartedYear(String(y))
                  setStartedMonth(m - 1)
                } else {
                  setEndedDate(newDate)
                  setEndedYear(String(y))
                  setEndedMonth(m - 1)
                }
              }
            }}
            style={{
              marginTop: 8, width: '100%',
              background: '#0E0B0B',
              color: 'white',
              border: '1px solid #3D3535',
              borderRadius: 8,
              padding: '12px 16px',
              fontSize: 14,
              colorScheme: 'dark',
              outline: 'none',
              cursor: 'pointer',
            } as React.CSSProperties}
          />
        )}

        {/* iOS inline picker */}
        {Platform.OS === 'ios' && iosPickerField === field && precision === 'day' && (
          <DateTimePicker
            value={date ?? new Date()}
            mode="date"
            display="spinner"
            onChange={(e, d) => handleDateChange(e, d, field)}
            textColor="white"
          />
        )}
      </View>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        className="flex-1 justify-center items-center px-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      >
        <View className="bg-[#1C1717] border border-[#3D3535] rounded-xl p-6 w-full">
          <Text className="text-white text-lg font-bold mb-6 text-center">{title}</Text>

          {type !== 'film' && renderDateField(
            'started', 'Commencé le',
            startedDate, setStartedDate,
            startedPrecision, setStartedPrecision,
            startedYear, setStartedYear,
            startedMonth, setStartedMonth,
            true,
          )}

          {renderDateField(
            'ended', endedLabel,
            endedDate, setEndedDate,
            endedPrecision, setEndedPrecision,
            endedYear, setEndedYear,
            endedMonth, setEndedMonth,
            false,
          )}

          <View className="flex-row gap-3 justify-end mt-2 flex-wrap">
            <TouchableOpacity onPress={onCancel} className="px-4 py-2">
              <Text className="text-[#6B5E5E]">Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onValidate()}
              className="px-4 py-2 rounded-lg border border-[#3D3535]"
            >
              <Text className="text-[#6B5E5E] font-medium">Sans date</Text>
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

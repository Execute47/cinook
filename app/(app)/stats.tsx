import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useYearStats } from '@/hooks/useYearStats'
import { MonthBar } from '@/components/stats/MonthBar'
import ItemCard from '@/components/media/ItemCard'

const MONTH_LABELS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const MONTH_FULL_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const TYPE_LABELS: Record<string, string> = {
  film: 'Film',
  serie: 'Série',
  livre: 'Livre',
}

const TIER_LABELS: Record<string, string> = {
  diamond: '💎',
  gold: '🥇',
  silver: '🥈',
  bronze: '🥉',
  seen: '👁',
  disliked: '👎',
  none: '',
}

export default function StatsScreen() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null)
  const stats = useYearStats(selectedYear)
  const maxCount = Math.max(...stats.byMonth, 1)

  function handleYearChange(delta: number) {
    setSelectedYear((y) => y + delta)
    setSelectedMonth(null)
  }

  function handleMonthPress(month: number) {
    setSelectedMonth((prev) => (prev === month ? null : month))
  }

  return (
    <ScrollView className="flex-1 bg-[#0E0B0B]">
      {/* Header */}
      <View className="px-4 pt-12 pb-3">
        <Text className="text-white text-2xl font-bold">Mon Bilan</Text>
      </View>

      {/* Sélecteur d'année */}
      <View className="flex-row items-center justify-center gap-6 py-4">
        <TouchableOpacity
          onPress={() => handleYearChange(-1)}
          className="w-10 h-10 items-center justify-center"
        >
          <Text className="text-[#FBBF24] text-2xl">{'<'}</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-semibold w-16 text-center">{selectedYear}</Text>
        <TouchableOpacity
          onPress={() => handleYearChange(1)}
          disabled={selectedYear >= currentYear}
          className="w-10 h-10 items-center justify-center"
        >
          <Text
            className={
              selectedYear >= currentYear ? 'text-[#3A2E2E] text-2xl' : 'text-[#FBBF24] text-2xl'
            }
          >
            {'>'}
          </Text>
        </TouchableOpacity>
      </View>

      {!stats.hasData ? (
        <View className="px-4 py-12 items-center">
          <Text className="text-[#6B5E5E] text-center">
            Aucune activité enregistrée pour cette année
          </Text>
        </View>
      ) : (
        <>
          {/* Comptages */}
          <View className="px-4 pb-6">
            <Text className="text-white text-lg font-semibold mb-3">Consommations</Text>
            <View className="flex-row gap-3">
              <CountCard label="Films" count={stats.counts.film} />
              <CountCard label="Séries" count={stats.counts.serie} />
              <CountCard label="Livres" count={stats.counts.livre} />
            </View>
            <View className="mt-3 bg-[#1C1717] rounded-lg p-3 items-center">
              <Text className="text-[#FBBF24] text-2xl font-bold">{stats.counts.total}</Text>
              <Text className="text-[#6B5E5E] text-xs">Total</Text>
            </View>
          </View>

          {/* Tops */}
          {(stats.topTier.length > 0 || stats.topRating.length > 0) && (
            <View className="px-4 pb-6">
              <Text className="text-white text-lg font-semibold mb-3">Mes tops</Text>

              {stats.topTier.length > 0 && (
                <View className="mb-3">
                  <Text className="text-[#6B5E5E] text-xs mb-2">Meilleur tier</Text>
                  {stats.topTier.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row items-center gap-3 bg-[#1C1717] rounded-lg p-3 mb-1"
                    >
                      {item.poster ? (
                        <Image
                          source={{ uri: item.poster }}
                          className="w-8 h-12 rounded"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-8 h-12 rounded bg-[#2A2020]" />
                      )}
                      <View className="flex-1">
                        <Text className="text-white text-sm font-medium" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-[#6B5E5E] text-xs">{TYPE_LABELS[item.type]}</Text>
                      </View>
                      <Text className="text-lg">{TIER_LABELS[item.tier]}</Text>
                    </View>
                  ))}
                </View>
              )}

              {stats.topRating.length > 0 && (
                <View>
                  <Text className="text-[#6B5E5E] text-xs mb-2">Meilleure note</Text>
                  {stats.topRating.map((item) => (
                    <View
                      key={item.id}
                      className="flex-row items-center gap-3 bg-[#1C1717] rounded-lg p-3 mb-1"
                    >
                      {item.poster ? (
                        <Image
                          source={{ uri: item.poster }}
                          className="w-8 h-12 rounded"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-8 h-12 rounded bg-[#2A2020]" />
                      )}
                      <View className="flex-1">
                        <Text className="text-white text-sm font-medium" numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text className="text-[#6B5E5E] text-xs">{TYPE_LABELS[item.type]}</Text>
                      </View>
                      <Text className="text-[#FBBF24] font-bold">{'★'.repeat(item.rating ?? 0)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Activité mensuelle */}
          <View className="px-4 pb-8">
            <Text className="text-white text-lg font-semibold mb-3">Activité mensuelle</Text>
            <View className="bg-[#1C1717] rounded-lg p-4">
              <View className="flex-row items-end" style={{ height: 100 }}>
                {stats.byMonth.map((count, index) => (
                  <MonthBar
                    key={index}
                    count={count}
                    label={MONTH_LABELS[index]}
                    maxCount={maxCount}
                    selected={selectedMonth === index}
                    onPress={() => handleMonthPress(index)}
                  />
                ))}
              </View>
            </View>

            {selectedMonth !== null && (
              <View className="mt-3">
                <Text className="text-[#FBBF24] text-sm font-semibold mb-2">
                  {MONTH_FULL_LABELS[selectedMonth]} — {stats.byMonth[selectedMonth]} œuvre{stats.byMonth[selectedMonth] > 1 ? 's' : ''}
                </Text>
                {stats.itemsByMonth[selectedMonth].length === 0 ? (
                  <Text className="text-[#6B5E5E] text-sm">Aucune activité ce mois-ci</Text>
                ) : (
                  stats.itemsByMonth[selectedMonth].map((item) => (
                    <ItemCard key={item.id} item={item} onPress={(id) => router.push(`/(app)/item/${id}`)} />
                  ))
                )}
              </View>
            )}
          </View>
        </>
      )}
    </ScrollView>
  )
}

function CountCard({ label, count }: { label: string; count: number }) {
  return (
    <View className="flex-1 bg-[#1C1717] rounded-lg p-3 items-center">
      <Text className="text-[#FBBF24] text-xl font-bold">{count}</Text>
      <Text className="text-[#6B5E5E] text-xs">{label}</Text>
    </View>
  )
}

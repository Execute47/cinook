import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

const MAX_BAR_HEIGHT = 80
const MIN_BAR_HEIGHT = 2

interface MonthBarProps {
  count: number
  label: string
  maxCount: number
  selected?: boolean
  onPress?: () => void
}

export function MonthBar({ count, label, maxCount, selected, onPress }: MonthBarProps) {
  const height = maxCount === 0 ? MIN_BAR_HEIGHT : Math.max((count / maxCount) * MAX_BAR_HEIGHT, MIN_BAR_HEIGHT)

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      {count > 0 && <Text style={styles.count}>{count}</Text>}
      <View style={[styles.bar, { height }, selected && styles.barSelected]} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  bar: {
    width: '60%',
    backgroundColor: '#FBBF24',
    borderRadius: 2,
    minHeight: MIN_BAR_HEIGHT,
  },
  barSelected: {
    backgroundColor: '#F59E0B',
    width: '80%',
  },
  count: {
    color: '#F5F0F0',
    fontSize: 10,
    marginBottom: 2,
  },
  label: {
    color: '#6B5E5E',
    fontSize: 10,
    marginTop: 4,
  },
  labelSelected: {
    color: '#FBBF24',
  },
})

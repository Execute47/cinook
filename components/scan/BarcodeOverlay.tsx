import React, { useEffect, useRef } from 'react'
import { View, Text, Animated, StyleSheet } from 'react-native'

export default function BarcodeOverlay() {
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    )
    pulse.start()
    return () => pulse.stop()
  }, [opacity])

  return (
    <View style={StyleSheet.absoluteFill} className="items-center justify-center">
      <Animated.View style={[styles.viewfinder, { opacity }]} />
      <Text className="text-white text-sm mt-4 text-center px-4">
        Pointez la caméra vers un code-barres
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  viewfinder: {
    width: 240,
    height: 160,
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
})

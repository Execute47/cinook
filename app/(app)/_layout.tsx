import { View } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SyncIndicator } from '@/components/ui/SyncIndicator'
import { useNetworkStatus } from '@/hooks/useNetworkStatus'

export default function AppLayout() {
  useNetworkStatus()

  return (
    <View style={{ flex: 1 }}>
      <SyncIndicator />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0E0B0B', borderTopColor: '#1C1717' },
        tabBarActiveTintColor: '#FBBF24',
        tabBarInactiveTintColor: '#6B5E5E',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'Collection',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="discover" options={{ href: null }} />
      <Tabs.Screen
        name="circle"
        options={{
          title: 'Cercle',
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Bilan',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Paramètres',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="member/[uid]" options={{ href: null }} />
      <Tabs.Screen name="item/[id]" options={{ href: null }} />
      <Tabs.Screen name="item/preview" options={{ href: null }} />
      <Tabs.Screen name="playlists" options={{ href: null }} />
      <Tabs.Screen name="playlist/[id]" options={{ href: null }} />
    </Tabs>
    </View>
  )
}

import { Tabs } from 'expo-router'

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0E0B0B', borderTopColor: '#1C1717' },
        tabBarActiveTintColor: '#FBBF24',
        tabBarInactiveTintColor: '#6B5E5E',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
      <Tabs.Screen name="discover" options={{ title: 'Découverte' }} />
      <Tabs.Screen name="circle" options={{ title: 'Cercle' }} />
      <Tabs.Screen name="settings" options={{ title: 'Paramètres' }} />
      <Tabs.Screen name="member/[uid]" options={{ href: null }} />
      <Tabs.Screen name="item/[id]" options={{ href: null }} />
    </Tabs>
  )
}

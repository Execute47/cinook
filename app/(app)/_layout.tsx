import { Tabs } from 'expo-router'

// Tab navigation — implémenté complètement en Story 1.3
// 4 tabs : Accueil, Collection, Découverte, Cercle

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: '#0E0B0B' }, tabBarActiveTintColor: '#FBBF24' }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
      <Tabs.Screen name="discover" options={{ title: 'Découverte' }} />
      <Tabs.Screen name="circle" options={{ title: 'Cercle' }} />
    </Tabs>
  )
}

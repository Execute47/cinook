import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const validate = (): boolean => {
    let valid = true
    setEmailError(null)
    setPasswordError(null)

    if (!email.includes('@')) {
      setEmailError('Email invalide')
      valid = false
    }
    if (password.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères')
      valid = false
    }
    return valid
  }

  const handleRegister = async () => {
    if (!validate()) return

    setIsLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password)

      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() })
      }

      try {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: displayName.trim() || null,
          email: user.email,
          circleId: null,
          createdAt: serverTimestamp(),
        })
      } catch (firestoreError) {
        console.error('Firestore profile creation failed (non-blocking):', firestoreError)
      }

      useAuthStore.getState().setUser(user.uid, user.email ?? email, displayName.trim() || null)
      router.replace('/(app)/')
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (error.code === 'auth/email-already-in-use') {
          setEmailError('Ce compte existe déjà')
        } else {
          useUIStore.getState().addToast('Une erreur est survenue', 'error')
          console.error(error)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-[#0E0B0B]"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 justify-center py-12">
        <Text className="text-amber-400 text-2xl font-bold mb-8 text-center">
          Créer un compte
        </Text>

        {/* Prénom */}
        <TextInput
          placeholder="Prénom (optionnel)"
          placeholderTextColor="#6B5E5E"
          value={displayName}
          onChangeText={setDisplayName}
          autoCapitalize="words"
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-4"
        />

        {/* Email */}
        <TextInput
          placeholder="Email"
          placeholderTextColor="#6B5E5E"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-1"
        />
        {emailError && (
          <Text className="text-red-400 text-sm mb-3">{emailError}</Text>
        )}
        {!emailError && <View className="mb-3" />}

        {/* Mot de passe */}
        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#6B5E5E"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          className="bg-[#1C1717] text-white border border-[#3D3535] rounded-lg px-4 py-3 mb-1"
        />
        {passwordError && (
          <Text className="text-red-400 text-sm mb-3">{passwordError}</Text>
        )}
        {!passwordError && <View className="mb-3" />}

        {/* Bouton principal */}
        <TouchableOpacity
          onPress={handleRegister}
          disabled={isLoading}
          className="bg-amber-400 rounded-lg py-3 items-center mt-4"
        >
          <Text className="text-[#0E0B0B] font-bold text-base">
            {isLoading ? 'Création...' : 'Créer mon compte'}
          </Text>
        </TouchableOpacity>

        {/* Lien login */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login')}
          className="mt-6 items-center"
        >
          <Text className="text-[#6B5E5E]">
            Déjà un compte ?{' '}
            <Text className="text-amber-400">Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

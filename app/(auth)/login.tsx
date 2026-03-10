import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { FirebaseError } from 'firebase/app'
import { auth, db } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { signInWithGoogle } from '@/lib/auth'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const validate = (): boolean => {
    let valid = true
    setEmailError(null)
    setPasswordError(null)
    setLoginError(null)

    if (!email.trim()) {
      setEmailError('Email requis')
      valid = false
    }
    if (!password) {
      setPasswordError('Mot de passe requis')
      valid = false
    }
    return valid
  }

  const handleLogin = async () => {
    if (!validate()) return

    setIsLoading(true)
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password)

      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const data = userDoc.data()

      useAuthStore.getState().setUser(user.uid, user.email ?? email, data?.displayName ?? null)
      if (data?.circleId) {
        useAuthStore.getState().setCircle(data.circleId, false)
      }
      router.replace('/(app)/')
    } catch (error) {
      if (error instanceof FirebaseError) {
        if (
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password'
        ) {
          setLoginError('Email ou mot de passe incorrect')
        } else if (error.code === 'auth/too-many-requests') {
          setLoginError('Trop de tentatives. Réessaie plus tard.')
        } else {
          useUIStore.getState().addToast('Une erreur est survenue', 'error')
          console.error(error)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    const success = await signInWithGoogle()
    setIsGoogleLoading(false)
    if (success) router.replace('/(app)/')
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-[#0E0B0B]"
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 px-6 justify-center py-12">
        <Text className="text-amber-400 text-2xl font-bold mb-8 text-center">
          Connexion
        </Text>

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

        {/* Erreur login globale */}
        {loginError && (
          <Text className="text-red-400 text-sm text-center mb-3">{loginError}</Text>
        )}

        {/* Bouton principal */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={isLoading}
          className="bg-amber-400 rounded-lg py-3 items-center mt-2"
        >
          <Text className="text-[#0E0B0B] font-bold text-base">
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>

        {/* Séparateur */}
        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-[#3D3535]" />
          <Text className="text-[#6B5E5E] mx-4">ou</Text>
          <View className="flex-1 h-px bg-[#3D3535]" />
        </View>

        {/* Bouton Google */}
        <GoogleSignInButton onPress={handleGoogleSignIn} isLoading={isGoogleLoading} />

        {/* Lien register */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/register')}
          className="mt-6 items-center"
        >
          <Text className="text-[#6B5E5E]">
            Pas encore de compte ?{' '}
            <Text className="text-amber-400">Créer un compte</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

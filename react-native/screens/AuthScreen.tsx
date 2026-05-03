// waliFit — AuthScreen
// Handles: Welcome → Sign Up / Login → Forgot Password
// Auth via Supabase: Email + Apple Sign In + Google Sign In
// Apple Sign In is MANDATORY when Google is offered (App Store rule)

import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Eye, EyeOff, Apple, Mail, ArrowLeft } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'
import { hasSupabaseConfig, supabase } from '../utils/supabase'

type AuthView = 'welcome' | 'signup' | 'login' | 'forgot'
type OAuthProvider = 'apple' | 'google'

interface AuthScreenProps {
  onAuthComplete: () => void
}

export default function AuthScreen({ onAuthComplete }: AuthScreenProps) {
  const [view, setView] = useState<AuthView>('welcome')
  const [loading, setLoading] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      const code = readParam(url, 'code')
      if (!code || !supabase) return

      setLoading('oauth')
      setAuthError(null)
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      setLoading(null)
      if (error) {
        setAuthError(error.message)
        return
      }
      onAuthComplete()
    }

    const sub = Linking.addEventListener('url', handleUrl)
    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl({ url })
    })

    return () => sub.remove()
  }, [onAuthComplete])

  const requireClient = () => {
    if (!hasSupabaseConfig || !supabase) {
      setAuthError('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.')
      return null
    }
    return supabase
  }

  const signUp = async (email: string, password: string, username: string) => {
    const client = requireClient()
    if (!client) return

    setLoading('signup')
    setAuthError(null)
    const { error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { username: username.trim() },
      },
    })
    setLoading(null)
    if (error) {
      setAuthError(error.message)
      return
    }
    onAuthComplete()
  }

  const signIn = async (email: string, password: string) => {
    const client = requireClient()
    if (!client) return

    setLoading('login')
    setAuthError(null)
    const { error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setLoading(null)
    if (error) {
      setAuthError(error.message)
      return
    }
    onAuthComplete()
  }

  const sendPasswordReset = async (email: string): Promise<boolean> => {
    const client = requireClient()
    if (!client) return false

    setLoading('forgot')
    setAuthError(null)
    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'walifit://auth/callback',
    })
    setLoading(null)
    if (error) {
      setAuthError(error.message)
      return false
    }
    setAuthError('Password reset email sent.')
    return true
  }

  const startOAuth = async (provider: OAuthProvider) => {
    const client = requireClient()
    if (!client) return

    setLoading(provider)
    setAuthError(null)
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: 'walifit://auth/callback',
        skipBrowserRedirect: true,
      },
    })
    if (error || !data.url) {
      setLoading(null)
      setAuthError(error?.message ?? `Unable to start ${provider} sign-in.`)
      return
    }

    try {
      await Linking.openURL(data.url)
    } catch {
      setLoading(null)
      setAuthError(`Unable to open ${provider} sign-in.`)
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {view === 'welcome'  && <WelcomeView onGetStarted={() => setView('signup')} onLogin={() => setView('login')} />}
      {view === 'signup'   && <SignUpView onBack={() => setView('welcome')} onSubmit={signUp} onOAuth={startOAuth} onLogin={() => setView('login')} loading={loading} error={authError} />}
      {view === 'login'    && <LoginView onBack={() => setView('welcome')} onSubmit={signIn} onOAuth={startOAuth} onForgot={() => setView('forgot')} onSignUp={() => setView('signup')} loading={loading} error={authError} />}
      {view === 'forgot'   && <ForgotView onBack={() => setView('login')} onSubmit={sendPasswordReset} loading={loading} message={authError} />}
    </SafeAreaView>
  )
}

function readParam(url: string, name: string): string | null {
  const [, queryAndHash = ''] = url.split('?')
  const [query = '', hashFromQuery = ''] = queryAndHash.split('#')
  const hash = hashFromQuery || url.split('#')[1] || ''
  const search = [query, hash].filter(Boolean).join('&')

  for (const part of search.split('&')) {
    const [key, value] = part.split('=')
    if (decodeURIComponent(key ?? '') === name) {
      return decodeURIComponent(value ?? '')
    }
  }
  return null
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

function WelcomeView({ onGetStarted, onLogin }: { onGetStarted: () => void; onLogin: () => void }) {
  return (
    <View style={styles.welcomeContainer}>
      {/* Tree illustration placeholder */}
      <View style={styles.treePlaceholder}>
        <Text style={styles.treeEmoji}>🌱</Text>
      </View>

      <View style={styles.welcomeText}>
        <Text style={styles.appName}>waliFit</Text>
        <Text style={styles.tagline}>Train harder.{'\n'}Grow stronger.{'\n'}Compete louder.</Text>
      </View>

      <View style={styles.welcomeActions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onGetStarted}>
          <Text style={styles.primaryBtnText}>Get started</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.ghostBtn} onPress={onLogin}>
          <Text style={styles.ghostBtnText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

function SignUpView({ onBack, onSubmit, onOAuth, onLogin, loading, error }: {
  onBack: () => void; onSubmit: (email: string, password: string, username: string) => Promise<void>; onOAuth: (provider: OAuthProvider) => Promise<void>; onLogin: () => void; loading: string | null; error: string | null
}) {
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [usernameOk, setUsernameOk] = useState<boolean | null>(null)

  // Debounce username check — wire to GET /auth/check-username in production
  const checkUsername = (val: string) => {
    setUsername(val)
    if (val.length >= 3) {
      setTimeout(() => setUsernameOk(val !== 'taken'), 600)
    } else {
      setUsernameOk(null)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft color={colors.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>

        <Text style={styles.formTitle}>Create account</Text>
        <Text style={styles.formSubtitle}>Join the squad</Text>

        {/* Social auth */}
        <TouchableOpacity style={styles.socialBtn} onPress={() => { void onOAuth('apple') }} disabled={Boolean(loading)}>
          <Apple color={colors.foreground} size={20} strokeWidth={1.75} />
          <Text style={styles.socialBtnText}>{loading === 'apple' ? 'Opening Apple...' : 'Continue with Apple'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { marginTop: spacing.sm }]} onPress={() => { void onOAuth('google') }} disabled={Boolean(loading)}>
          <View style={styles.googleIcon}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.googleBrand }}>G</Text></View>
          <Text style={styles.socialBtnText}>{loading === 'google' ? 'Opening Google...' : 'Continue with Google'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email */}
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

        {/* Username */}
        <Text style={styles.inputLabel}>Username</Text>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, styles.flex]} value={username} onChangeText={checkUsername}
            placeholder="yourhandle" placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none" autoCorrect={false} />
          {usernameOk === true  && <Text style={[styles.inputStatus, { color: colors.primary }]}>✓</Text>}
          {usernameOk === false && <Text style={[styles.inputStatus, { color: colors.destructive }]}>✗ taken</Text>}
        </View>

        {/* Password */}
        <Text style={styles.inputLabel}>Password</Text>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, styles.flex]} value={password} onChangeText={setPassword}
            placeholder="8+ characters" placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPw} autoCapitalize="none" />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
            {showPw
              ? <EyeOff color={colors.mutedForeground} size={18} strokeWidth={1.75} />
              : <Eye    color={colors.mutedForeground} size={18} strokeWidth={1.75} />}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: spacing.lg }, loading && styles.disabledBtn]}
          onPress={() => { void onSubmit(email, password, username) }}
          disabled={Boolean(loading)}
        >
          <Text style={styles.primaryBtnText}>{loading === 'signup' ? 'Creating account...' : 'Create account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAuthRow} onPress={onLogin}>
          <Text style={styles.switchAuthText}>Already have an account? </Text>
          <Text style={[styles.switchAuthText, { color: colors.primary }]}>Log in</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          By continuing you agree to our Terms of Service and Privacy Policy.
          Wali AI requires separate consent shown at first use.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginView({ onBack, onSubmit, onOAuth, onForgot, onSignUp, loading, error }: {
  onBack: () => void; onSubmit: (email: string, password: string) => Promise<void>; onOAuth: (provider: OAuthProvider) => Promise<void>; onForgot: () => void; onSignUp: () => void; loading: string | null; error: string | null
}) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]   = useState(false)

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <ArrowLeft color={colors.foreground} size={20} strokeWidth={1.75} />
        </TouchableOpacity>

        <Text style={styles.formTitle}>Welcome back</Text>
        <Text style={styles.formSubtitle}>Your tree missed you</Text>

        <TouchableOpacity style={styles.socialBtn} onPress={() => { void onOAuth('apple') }} disabled={Boolean(loading)}>
          <Apple color={colors.foreground} size={20} strokeWidth={1.75} />
          <Text style={styles.socialBtnText}>{loading === 'apple' ? 'Opening Apple...' : 'Continue with Apple'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.socialBtn, { marginTop: spacing.sm }]} onPress={() => { void onOAuth('google') }} disabled={Boolean(loading)}>
          <View style={styles.googleIcon}><Text style={{ fontSize: 14, fontWeight: '700', color: colors.googleBrand }}>G</Text></View>
          <Text style={styles.socialBtnText}>{loading === 'google' ? 'Opening Google...' : 'Continue with Google'}</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Text style={styles.inputLabel}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail}
          placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />

        <View style={styles.passwordHeader}>
          <Text style={styles.inputLabel}>Password</Text>
          <TouchableOpacity onPress={onForgot}>
            <Text style={[styles.inputLabel, { color: colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.inputRow}>
          <TextInput style={[styles.input, styles.flex]} value={password} onChangeText={setPassword}
            placeholder="Your password" placeholderTextColor={colors.mutedForeground}
            secureTextEntry={!showPw} autoCapitalize="none" />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(!showPw)}>
            {showPw
              ? <EyeOff color={colors.mutedForeground} size={18} strokeWidth={1.75} />
              : <Eye    color={colors.mutedForeground} size={18} strokeWidth={1.75} />}
          </TouchableOpacity>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryBtn, { marginTop: spacing.lg }, loading && styles.disabledBtn]}
          onPress={() => { void onSubmit(email, password) }}
          disabled={Boolean(loading)}
        >
          <Text style={styles.primaryBtnText}>{loading === 'login' ? 'Logging in...' : 'Log in'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.switchAuthRow} onPress={onSignUp}>
          <Text style={styles.switchAuthText}>New to waliFit? </Text>
          <Text style={[styles.switchAuthText, { color: colors.primary }]}>Create account</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

function ForgotView({ onBack, onSubmit, loading, message }: {
  onBack: () => void; onSubmit: (email: string) => Promise<boolean>; loading: string | null; message: string | null
}) {
  const [email, setEmail] = useState('')
  const [sent, setSent]   = useState(false)

  const handleSubmit = async () => {
    const ok = await onSubmit(email)
    if (ok) setSent(true)
  }

  return (
    <View style={styles.formContainer}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <ArrowLeft color={colors.foreground} size={20} strokeWidth={1.75} />
      </TouchableOpacity>

      {!sent ? (
        <>
          <Text style={styles.formTitle}>Reset password</Text>
          <Text style={styles.formSubtitle}>We'll send a reset link to your email</Text>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail}
            placeholder="you@example.com" placeholderTextColor={colors.mutedForeground}
            keyboardType="email-address" autoCapitalize="none" />
          {message ? <Text style={styles.errorText}>{message}</Text> : null}
          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: spacing.lg }, loading && styles.disabledBtn]}
            onPress={() => { void handleSubmit() }}
            disabled={Boolean(loading)}
          >
            <Text style={styles.primaryBtnText}>{loading === 'forgot' ? 'Sending...' : 'Send reset link'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.sentContainer}>
          <Mail color={colors.primary} size={48} strokeWidth={1.5} />
          <Text style={styles.formTitle}>Check your email</Text>
          <Text style={styles.formSubtitle}>Reset link sent to {email}</Text>
          <TouchableOpacity style={[styles.ghostBtn, { marginTop: spacing.xl }]} onPress={onBack}>
            <Text style={styles.ghostBtnText}>Back to login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.background },
  flex:             { flex: 1 },
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: spacing.xxl * 1.5, paddingBottom: spacing.xxl },
  treePlaceholder:  { width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.primary + '40' },
  treeEmoji:        { fontSize: 64 },
  welcomeText:      { alignItems: 'center', gap: spacing.sm },
  appName:          { fontSize: 40, fontWeight: typography.weight.extrabold, color: colors.foreground, letterSpacing: -1 },
  tagline:          { fontSize: typography.size.xl, color: colors.mutedForeground, textAlign: 'center', lineHeight: 32 },
  welcomeActions:   { width: '100%', gap: spacing.sm },
  formContainer:    { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  backBtn:          { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, marginLeft: -spacing.sm },
  formTitle:        { fontSize: typography.size['2xl'], fontWeight: typography.weight.bold, color: colors.foreground },
  formSubtitle:     { fontSize: typography.size.base, color: colors.mutedForeground, marginTop: -spacing.xs },
  socialBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, height: touchTarget.comfortable },
  socialBtnText:    { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  googleIcon:       { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  dividerRow:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dividerLine:      { flex: 1, height: 0.5, backgroundColor: colors.border },
  dividerText:      { fontSize: typography.size.sm, color: colors.mutedForeground },
  inputLabel:       { fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.mutedForeground },
  input:            { height: touchTarget.comfortable, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, fontSize: typography.size.base, color: colors.foreground },
  inputRow:         { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inputStatus:      { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, minWidth: 50 },
  eyeBtn:           { position: 'absolute', right: spacing.md, height: touchTarget.comfortable, alignItems: 'center', justifyContent: 'center' },
  passwordHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryBtn:       { height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText:   { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  disabledBtn:      { opacity: 0.6 },
  errorText:        { fontSize: typography.size.sm, color: colors.destructive, lineHeight: 20 },
  ghostBtn:         { height: touchTarget.comfortable, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  ghostBtnText:     { fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground },
  switchAuthRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  switchAuthText:   { fontSize: typography.size.sm, color: colors.mutedForeground },
  legalText:        { fontSize: typography.size.xs, color: colors.mutedForeground, textAlign: 'center', lineHeight: 18 },
  sentContainer:    { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl },
})

// waliFit — CoachScreen (Tab 4)
// Wali AI: Daily Coach Chat + Program Architect + Cold Start proactive prompt
// Contractor builds UI only — AI responses are mocked during development
// Streaming responses render token-by-token

import React, { useState, useRef } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Bot, Send, Paperclip, ChevronRight, RefreshCw, Check, Zap } from 'lucide-react-native'
import { colors, spacing, typography, radius, touchTarget } from '../theme'

type CoachView = 'home' | 'chat' | 'program'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_PROGRAM = {
  weeks: 6,
  days: [
    { day: 'Monday',    session: 'Push A — Bench, OHP, Dips, Triceps' },
    { day: 'Tuesday',   session: 'Run — Easy 5K' },
    { day: 'Wednesday', session: 'Pull A — Deadlift, Rows, Curls' },
    { day: 'Thursday',  session: 'Rest / Mobility' },
    { day: 'Friday',    session: 'Push B — Incline, Lateral Raises, Triceps' },
    { day: 'Saturday',  session: 'Run — Tempo 4K' },
    { day: 'Sunday',    session: 'Rest' },
  ],
  rationale: 'Upper/lower hybrid split with two run sessions. Matches your 4-day preference and hybrid performance goal. Deload built in at Week 3 and Week 6.',
}

type Message = {
  id: string
  role: 'ai' | 'user'
  content: string
  time: string
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1', role: 'ai',
    content: "Hey Marcus — your program starts with Push Day A today. You said hybrid performance is your goal, so I've built conditioning finishers after every upper session. Quick question to dial this in: how much time do you usually have after your main lifts?",
    time: 'Just now',
  },
]

const SUGGESTIONS = [
  'Substitute an exercise',
  'Explain this movement',
  'Adjust today\'s volume',
  'What should I eat before training?',
]

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CoachScreen() {
  const [view, setView] = useState<CoachView>('home')

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {view === 'home'    && <CoachHome    onStartChat={() => setView('chat')} onGenerate={() => setView('program')} />}
      {view === 'chat'    && <CoachChat    onBack={() => setView('home')} />}
      {view === 'program' && <ProgramArchitect onBack={() => setView('home')} />}
    </SafeAreaView>
  )
}

// ─── Coach Home ───────────────────────────────────────────────────────────────

function CoachHome({ onStartChat, onGenerate }: { onStartChat: () => void; onGenerate: () => void }) {
  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.homeHeader}>
        <View style={[styles.aiAvatar, { backgroundColor: colors.primary + '20' }]}>
          <Bot color={colors.primary} size={28} strokeWidth={1.75} />
        </View>
        <View>
          <Text style={styles.homeTitle}>Wali AI</Text>
          <Text style={styles.homeSubtitle}>Your hybrid performance coach</Text>
        </View>
      </View>

      {/* AI disclaimer */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          Wali AI is a training assistant. Not medical advice. Consult a professional for health decisions.
        </Text>
      </View>

      {/* Today's context */}
      <View style={styles.contextCard}>
        <Text style={styles.contextTitle}>Today's context</Text>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Scheduled workout</Text>
          <Text style={styles.contextValue}>Push Day A</Text>
        </View>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Current streak</Text>
          <Text style={[styles.contextValue, { color: colors.energy }]}>12 days</Text>
        </View>
        <View style={styles.contextItem}>
          <Text style={styles.contextLabel}>Tree health</Text>
          <Text style={[styles.contextValue, { color: colors.primary }]}>Growing (72)</Text>
        </View>
      </View>

      {/* Quick actions */}
      <Text style={styles.sectionLabel}>Quick actions</Text>
      <View style={styles.actionsGrid}>
        <ActionCard
          title="Chat with Wali"
          desc="Ask anything about training"
          color={colors.primary}
          onPress={onStartChat}
        />
        <ActionCard
          title="Generate program"
          desc="6-week training plan"
          color={colors.blue}
          onPress={onGenerate}
        />
      </View>

      {/* Suggested questions */}
      <Text style={styles.sectionLabel}>Try asking</Text>
      {SUGGESTIONS.map((s) => (
        <TouchableOpacity key={s} style={styles.suggestionRow} onPress={onStartChat} activeOpacity={0.7}>
          <Text style={styles.suggestionText}>{s}</Text>
          <ChevronRight color={colors.mutedForeground} size={16} strokeWidth={1.75} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

// ─── Coach Chat ───────────────────────────────────────────────────────────────

function CoachChat({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES)
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const scrollRef               = useRef<ScrollView>(null)

  const send = () => {
    if (!input.trim()) return
    const userMsg: Message = { id: String(Date.now()), role: 'user', content: input, time: 'Now' }
    setMessages(m => [...m, userMsg])
    setInput('')
    setTyping(true)
    // Simulate AI response
    setTimeout(() => {
      setTyping(false)
      setMessages(m => [...m, {
        id: String(Date.now() + 1),
        role: 'ai',
        content: "Perfect. I'll keep the conditioning blocks to 12–15 min — two rounds of a simple AMRAP-style circuit. That keeps intensity high without eating your recovery. I'll note it in each session.",
        time: 'Now',
      }])
    }, 1800)
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <View style={styles.chatHeaderCenter}>
          <Text style={styles.chatTitle}>Wali AI</Text>
          <Text style={styles.chatSubtitle}>Powered by Claude Sonnet</Text>
        </View>
        <View style={{ width: touchTarget.min }} />
      </View>

      {/* Disclaimer */}
      <View style={styles.chatDisclaimer}>
        <Text style={styles.chatDisclaimerText}>Not medical advice · Consult a professional for health decisions</Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View key={msg.id} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            {msg.role === 'ai' && (
              <View style={[styles.msgAvatar, { backgroundColor: colors.primary + '20' }]}>
                <Bot color={colors.primary} size={14} strokeWidth={1.75} />
              </View>
            )}
            <View style={[
              styles.msgBubble,
              msg.role === 'ai'
                ? { backgroundColor: colors.card, borderLeftWidth: 2, borderLeftColor: colors.primary }
                : { backgroundColor: colors.primary },
            ]}>
              <Text style={[styles.msgText, msg.role === 'user' && { color: colors.primaryFg }]}>
                {msg.content}
              </Text>
              <Text style={[styles.msgTime, msg.role === 'user' && { color: colors.primaryFg + 'AA' }]}>
                {msg.time}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing indicator */}
        {typing && (
          <View style={[styles.msgRow]}>
            <View style={[styles.msgAvatar, { backgroundColor: colors.primary + '20' }]}>
              <Bot color={colors.primary} size={14} strokeWidth={1.75} />
            </View>
            <View style={[styles.msgBubble, { backgroundColor: colors.card }]}>
              <Text style={[styles.msgText, { color: colors.mutedForeground }]}>Wali is thinking...</Text>
            </View>
          </View>
        )}

        {/* Suggestions when empty */}
        {messages.length <= 1 && (
          <View style={styles.suggestionsWrap}>
            {SUGGESTIONS.slice(0, 3).map(s => (
              <TouchableOpacity key={s} style={styles.suggestionChip} onPress={() => setInput(s)}>
                <Text style={[styles.suggestionChipText, { color: colors.primary }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.iconBtn}>
          <Paperclip color={colors.mutedForeground} size={18} strokeWidth={1.75} />
        </TouchableOpacity>
        <TextInput
          style={styles.chatInput}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Wali anything..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          returnKeyType="send"
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}
          onPress={send}
          disabled={!input.trim()}
        >
          <Send color={colors.primaryFg} size={16} strokeWidth={1.75} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

// ─── Program Architect ────────────────────────────────────────────────────────

function ProgramArchitect({ onBack }: { onBack: () => void }) {
  const [step, setStep]       = useState<'intro' | 'generating' | 'review'>('intro')
  const [accepted, setAccepted] = useState(false)

  return (
    <View style={styles.flex}>
      <View style={styles.chatHeader}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack}>
          <ChevronRight color={colors.foreground} size={20} strokeWidth={1.75} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.chatTitle}>Program Architect</Text>
        <View style={{ width: touchTarget.min }} />
      </View>

      <ScrollView contentContainerStyle={styles.programContent}>
        {step === 'intro' && (
          <>
            <View style={[styles.aiAvatar, { backgroundColor: colors.blue + '20', alignSelf: 'center' }]}>
              <Zap color={colors.blue} size={28} strokeWidth={1.75} />
            </View>
            <Text style={styles.programTitle}>Build your 6-week program</Text>
            <Text style={styles.programDesc}>
              Wali AI will create a personalised hybrid program based on your goal, training frequency, and equipment.
              It takes about 15 seconds.
            </Text>
            <View style={styles.programSummary}>
              <SummaryRow label="Goal"       value="Hybrid Performance" />
              <SummaryRow label="Frequency"  value="4 days / week" />
              <SummaryRow label="Duration"   value="6 weeks" />
              <SummaryRow label="Equipment"  value="Full gym" />
            </View>
            <TouchableOpacity style={styles.generateBtn} onPress={() => {
              setStep('generating')
              setTimeout(() => setStep('review'), 2500)
            }}>
              <Zap color={colors.primaryFg} size={18} strokeWidth={2} />
              <Text style={styles.generateBtnText}>Generate my program</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'generating' && (
          <View style={styles.generatingContainer}>
            <Bot color={colors.primary} size={48} strokeWidth={1.5} />
            <Text style={styles.generatingTitle}>Building your program...</Text>
            <Text style={styles.generatingDesc}>
              Wali AI is analysing your goals, scheduling 6 weeks of sessions, and balancing strength and conditioning loads.
            </Text>
          </View>
        )}

        {step === 'review' && (
          <>
            <Text style={styles.programTitle}>Your 6-week program</Text>
            <Text style={styles.programDesc}>{MOCK_PROGRAM.rationale}</Text>

            <View style={styles.weekTemplate}>
              <Text style={styles.weekTitle}>Weekly template</Text>
              {MOCK_PROGRAM.days.map((d, i) => (
                <View key={i} style={styles.dayRow}>
                  <Text style={styles.dayLabel}>{d.day}</Text>
                  <Text style={styles.daySession}>{d.session}</Text>
                </View>
              ))}
            </View>

            {!accepted ? (
              <View style={styles.programActions}>
                <TouchableOpacity style={styles.regenBtn} onPress={() => setStep('generating')}>
                  <RefreshCw color={colors.foreground} size={16} strokeWidth={1.75} />
                  <Text style={styles.regenBtnText}>Regenerate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => setAccepted(true)}>
                  <Check color={colors.primaryFg} size={16} strokeWidth={2.5} />
                  <Text style={styles.acceptBtnText}>Accept program</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.acceptedCard, { borderColor: colors.primary + '40', backgroundColor: colors.primary + '08' }]}>
                <Check color={colors.primary} size={20} strokeWidth={2.5} />
                <Text style={[styles.acceptBtnText, { color: colors.primary }]}>Program accepted — starts tomorrow</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActionCard({ title, desc, color, onPress }: { title: string; desc: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionDot, { backgroundColor: color + '20' }]}>
        <View style={[styles.actionDotInner, { backgroundColor: color }]} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </TouchableOpacity>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: colors.background },
  flex:               { flex: 1 },
  homeContent:        { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  homeHeader:         { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  aiAvatar:           { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  homeTitle:          { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground },
  homeSubtitle:       { fontSize: typography.size.sm, color: colors.mutedForeground },
  disclaimerBanner:   { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 0.5, borderColor: colors.border, borderLeftWidth: 3, borderLeftColor: colors.energy, padding: spacing.sm },
  disclaimerText:     { fontSize: typography.size.xs, color: colors.mutedForeground },
  contextCard:        { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  contextTitle:       { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground },
  contextItem:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  contextLabel:       { fontSize: typography.size.sm, color: colors.mutedForeground },
  contextValue:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground },
  sectionLabel:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.mutedForeground },
  actionsGrid:        { flexDirection: 'row', gap: spacing.sm },
  actionCard:         { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, gap: spacing.xs },
  actionDot:          { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  actionDotInner:     { width: 12, height: 12, borderRadius: 6 },
  actionTitle:        { fontSize: typography.size.sm, fontWeight: typography.weight.bold, color: colors.foreground },
  actionDesc:         { fontSize: typography.size.xs, color: colors.mutedForeground },
  suggestionRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, padding: spacing.md, minHeight: touchTarget.comfortable },
  suggestionText:     { fontSize: typography.size.sm, color: colors.foreground },
  chatHeader:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, paddingTop: spacing.xl, paddingBottom: spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  iconBtn:            { width: touchTarget.min, height: touchTarget.min, alignItems: 'center', justifyContent: 'center' },
  chatHeaderCenter:   { alignItems: 'center' },
  chatTitle:          { fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: colors.foreground },
  chatSubtitle:       { fontSize: typography.size.xs, color: colors.primary },
  chatDisclaimer:     { backgroundColor: colors.card, paddingHorizontal: spacing.screen, paddingVertical: spacing.xs, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  chatDisclaimerText: { fontSize: typography.size.xs, color: colors.mutedForeground, textAlign: 'center' },
  messagesContent:    { paddingHorizontal: spacing.screen, paddingTop: spacing.md, paddingBottom: spacing.xl, gap: spacing.md },
  msgRow:             { flexDirection: 'row', gap: spacing.sm, maxWidth: '90%' },
  msgRowUser:         { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAvatar:          { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  msgBubble:          { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.sm, gap: 3 },
  msgText:            { fontSize: typography.size.sm, color: colors.foreground, lineHeight: 20 },
  msgTime:            { fontSize: typography.size.xs, color: colors.mutedForeground },
  suggestionsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  suggestionChip:     { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary + '10', borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.primary + '40' },
  suggestionChipText: { fontSize: typography.size.sm, fontWeight: typography.weight.semibold },
  inputBar:           { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.screen, paddingBottom: spacing.xl, backgroundColor: colors.background, borderTopWidth: 0.5, borderTopColor: colors.border },
  chatInput:          { flex: 1, minHeight: touchTarget.comfortable, maxHeight: 120, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.size.base, color: colors.foreground },
  sendBtn:            { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  programContent:     { paddingHorizontal: spacing.screen, paddingTop: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md, alignItems: 'center' },
  programTitle:       { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground, textAlign: 'center' },
  programDesc:        { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  programSummary:     { width: '100%', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  summaryRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  summaryLabel:       { fontSize: typography.size.sm, color: colors.mutedForeground },
  summaryValue:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground },
  generateBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, width: '100%', height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full },
  generateBtnText:    { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  generatingContainer:{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  generatingTitle:    { fontSize: typography.size.xl, fontWeight: typography.weight.bold, color: colors.foreground },
  generatingDesc:     { fontSize: typography.size.sm, color: colors.mutedForeground, textAlign: 'center', lineHeight: 20 },
  weekTemplate:       { width: '100%', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 0.5, borderColor: colors.border, overflow: 'hidden' },
  weekTitle:          { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.foreground, padding: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  dayRow:             { flexDirection: 'row', padding: spacing.md, borderBottomWidth: 0.5, borderBottomColor: colors.border + '60', gap: spacing.md },
  dayLabel:           { width: 90, fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.primary },
  daySession:         { flex: 1, fontSize: typography.size.sm, color: colors.foreground },
  programActions:     { flexDirection: 'row', gap: spacing.sm, width: '100%' },
  regenBtn:           { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: touchTarget.comfortable, backgroundColor: colors.card, borderRadius: radius.full, borderWidth: 0.5, borderColor: colors.border },
  regenBtnText:       { fontSize: typography.size.sm, fontWeight: typography.weight.semibold, color: colors.foreground },
  acceptBtn:          { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, height: touchTarget.comfortable, backgroundColor: colors.primary, borderRadius: radius.full },
  acceptBtnText:      { fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.primaryFg },
  acceptedCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, width: '100%', borderRadius: radius.lg, borderWidth: 0.5, padding: spacing.md },
})

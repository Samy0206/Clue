import { useState, useRef, useEffect, useCallback } from 'react'
import {
  MessageCircle, FileText, GraduationCap, Code2, Calendar,
  ArrowUp, Paperclip, Globe, Mic, Eye, EyeOff, ChevronRight,
  MicOff, Plus, Copy, RotateCcw, Sun, Moon, Check, Trash2, X,
  Settings, User, Palette, Cpu, Shield, Keyboard, Info,
  Download, LogOut, Sliders, Save, AlertTriangle, RefreshCw,
  Upload, Search, Bell, Key, Zap, BookOpen, Hash, CheckSquare,
  ChevronDown, PlugZap
} from 'lucide-react'
import { supabase } from './supabase'

// ─── KONSTANTEN ───────────────────────────────────────────────────────────────
const MODI = [
  { id: 'chat',  label: 'Chat',      icon: MessageCircle, defaultSystem: 'Du bist Clue, ein persönlicher KI-Assistent. Antworte immer auf Deutsch, klar und freundlich.', suggestions: ['Was kannst du alles?', 'Erkläre mir KI einfach', 'Schreib mir eine Geschichte'] },
  { id: 'docs',  label: 'Dokumente', icon: FileText,      defaultSystem: 'Du bist Clue, ein Experte für Dokumentenanalyse. Analysiere Dokumente präzise. Antworte auf Deutsch.', suggestions: ['Fasse diesen Text zusammen', 'Extrahiere die Kernpunkte', 'Erstelle eine Gliederung'] },
  { id: 'learn', label: 'Lernen',    icon: GraduationCap, defaultSystem: 'Du bist Clue, ein motivierender Lerncoach. Erkläre Konzepte einfach, stelle Quizfragen. Antworte auf Deutsch.', suggestions: ['Erkläre mir Rekursion', 'Quiz über Datenbanken', 'Was ist Big O Notation?'] },
  { id: 'code',  label: 'Code',      icon: Code2,         defaultSystem: 'Du bist Clue, ein erfahrener Senior-Entwickler. Hilf beim Schreiben und Debuggen von Code. Formatiere Code immer in Codeblöcken mit Sprachangabe.', suggestions: ['Erkläre async/await', 'Was ist ein REST API?', 'Bubble Sort in Python'] },
  { id: 'cal',   label: 'Termine',   icon: Calendar,      defaultSystem: 'Du bist Clue, ein Kalender-Assistent. Hilf beim Planen von Terminen und Zeitmanagement. Antworte auf Deutsch.', suggestions: ['Plane meine Woche', 'Erstelle einen Lernplan', 'Hilf mir mit Zeitmanagement'] },
]

const MODELLE = [
  { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B',     desc: 'Empfohlen — stark & schnell' },
  { id: 'llama-3.1-8b-instant',    label: 'Llama 3.1 8B',      desc: 'Sehr schnell, leichter' },
  { id: 'mixtral-8x7b-32768',      label: 'Mixtral 8x7B',      desc: 'Gut für Deutsch' },
  { id: 'gemma2-9b-it',            label: 'Gemma 2 9B',         desc: 'Google Modell' },
  { id: 'deepseek-r1-distill-llama-70b', label: 'DeepSeek R1', desc: 'Stark bei Mathe & Code' },
]

const INTEGRATIONEN = [
  { id: 'google_cal', label: 'Google Kalender', icon: Calendar,    desc: 'Termine lesen & erstellen', status: 'bald' },
  { id: 'apple_cal',  label: 'Apple Kalender',  icon: Calendar,    desc: 'iCloud Termine',            status: 'bald' },
  { id: 'notion',     label: 'Notion',           icon: BookOpen,    desc: 'Seiten & Datenbanken',      status: 'bald' },
  { id: 'github',     label: 'GitHub',           icon: Code2,       desc: 'Repos & Issues',            status: 'bald' },
  { id: 'slack',      label: 'Slack',            icon: Hash,        desc: 'Nachrichten & Kanäle',      status: 'bald' },
  { id: 'todoist',    label: 'Todoist',          icon: CheckSquare, desc: 'Aufgaben synchronisieren',  status: 'bald' },
  { id: 'obsidian',   label: 'Obsidian',         icon: FileText,    desc: 'Notizen & Wissensbase',     status: 'bald' },
  { id: 'chrome',     label: 'Chrome Extension', icon: Globe,       desc: 'Browser-Integration',       status: 'bald' },
]

const DEFAULT_SETTINGS = {
  theme: 'dark', fontSize: 'medium', messageSpacing: 'comfortable',
  animations: true, model: 'llama-3.3-70b-versatile', temperature: 0.7, maxTokens: 1000,
  streamingEnabled: false, sendOnEnter: true, showTimestamps: false,
  compactSidebar: false, autoTitle: true, voiceLang: 'de-DE', responseLang: 'Deutsch',
  systemPrompts: Object.fromEntries(MODI.map(m => [m.id, m.defaultSystem])),
  avatarColor: '#818cf8', displayName: '',
  notifications: { sounds: false, chatResponse: true, mentions: true },
  schnellantworten: [
    { id: '1', titel: 'Zusammenfassen', text: 'Fasse das bitte kurz und prägnant zusammen.' },
    { id: '2', titel: 'Erklär einfach', text: 'Erkläre das so, als wäre ich ein Anfänger.' },
    { id: '3', titel: 'Code Review',    text: 'Überprüfe diesen Code auf Fehler und Verbesserungen.' },
  ],
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
function ladeChats() { try { return JSON.parse(localStorage.getItem('clue-chats') || '{}') } catch { return {} } }
function speichereChats(c) { localStorage.setItem('clue-chats', JSON.stringify(c)) }
function ladeSettings() { try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('clue-settings') || '{}') } } catch { return DEFAULT_SETTINGS } }
function speichereSettings(s) { localStorage.setItem('clue-settings', JSON.stringify(s)) }
function neuerChat(modusId) { return { id: Date.now().toString(), modusId, titel: 'Neuer Chat', nachrichten: [], ts: Date.now() } }

// ─── LOADING ANIMATION ────────────────────────────────────────────────────────
function LoadingAnimation() {
  return (
    <div className="loading-anim">
      <svg viewBox="0 0 80 40" width="64" height="32" fill="none">
        <path className="infinity-stroke"
          d="M40,20 C40,9 28,4 20,9 C12,14 12,26 20,31 C28,36 40,31 40,20 C40,9 52,4 60,9 C68,14 68,26 60,31 C52,36 40,31 40,20" />
      </svg>
    </div>
  )
}

// ─── MARKDOWN ─────────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button className="copy-btn" onClick={() => { navigator.clipboard?.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Kopiert' : 'Kopieren'}
    </button>
  )
}

function InlineText({ text }) {
  const parts = []; const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let last = 0, match, key = 0
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>)
    const m = match[0]
    if (m.startsWith('**')) parts.push(<strong key={key++}>{m.slice(2, -2)}</strong>)
    else if (m.startsWith('*')) parts.push(<em key={key++}>{m.slice(1, -1)}</em>)
    else parts.push(<code key={key++} className="inline-code">{m.slice(1, -1)}</code>)
    last = match.index + m.length
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>)
  return <>{parts}</>
}

function Markdown({ text }) {
  if (!text) return null
  const lines = text.split('\n'); const elements = []
  let i = 0, listItems = [], listType = null
  function flushList() {
    if (!listItems.length) return
    const El = listType === 'ol' ? 'ol' : 'ul'
    elements.push(<El key={`l${i}`}>{listItems}</El>)
    listItems = []; listType = null
  }
  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('```')) {
      flushList(); const lang = line.slice(3).trim() || 'code'; const codeLines = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      const code = codeLines.join('\n')
      elements.push(<div key={`cb${i}`} className="code-block"><div className="code-header"><span className="code-lang">{lang}</span><CopyBtn text={code} /></div><pre><code>{code}</code></pre></div>)
    } else if (line.startsWith('### ')) { flushList(); elements.push(<h3 key={i}><InlineText text={line.slice(4)} /></h3>) }
    else if (line.startsWith('## ')) { flushList(); elements.push(<h2 key={i}><InlineText text={line.slice(3)} /></h2>) }
    else if (line.startsWith('# ')) { flushList(); elements.push(<h1 key={i}><InlineText text={line.slice(2)} /></h1>) }
    else if (line.match(/^[-*] /)) { if (listType !== 'ul') { flushList(); listType = 'ul' }; listItems.push(<li key={i}><InlineText text={line.slice(2)} /></li>) }
    else if (line.match(/^\d+\. /)) { if (listType !== 'ol') { flushList(); listType = 'ol' }; listItems.push(<li key={i}><InlineText text={line.replace(/^\d+\. /, '')} /></li>) }
    else if (line.trim() === '') { flushList(); elements.push(<div key={`s${i}`} className="md-space" />) }
    else { flushList(); elements.push(<p key={i}><InlineText text={line} /></p>) }
    i++
  }
  flushList()
  return <div className="markdown">{elements}</div>
}

// ─── WEB SUCHE ────────────────────────────────────────────────────────────────
async function webSuche(query) {
  try {
    const key = import.meta.env.VITE_GOOGLE_SEARCH_KEY
    const cx = import.meta.env.VITE_GOOGLE_SEARCH_CX
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${encodeURIComponent(query)}&num=3`)
    const data = await res.json()
    return (data.items || []).map(r => ({ title: r.title, snippet: r.snippet, url: r.link }))
  } catch { return [] }
}

// ─── DATEI LESEN ─────────────────────────────────────────────────────────────
function dateiLesen(file) {
  return new Promise(resolve => {
    const r = new FileReader()
    r.onload = e => resolve(e.target.result)
    r.onerror = () => resolve(null)
    if (file.type.startsWith('image/')) r.readAsDataURL(file)
    else r.readAsText(file, 'UTF-8')
  })
}

// ─── SETTINGS COMPONENTS ─────────────────────────────────────────────────────
function Toggle({ value, onChange }) {
  return (
    <button className={`toggle ${value ? 'on' : ''}`} onClick={() => onChange(!value)}>
      <span className="toggle-knob" />
    </button>
  )
}

function SettingsRow({ label, desc, children }) {
  return (
    <div className="settings-row">
      <div className="settings-row-left">
        <span className="settings-row-label">{label}</span>
        {desc && <span className="settings-row-desc">{desc}</span>}
      </div>
      <div className="settings-row-right">{children}</div>
    </div>
  )
}

function SegmentedControl({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button key={o.value} className={`seg-btn ${value === o.value ? 'aktiv' : ''}`} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── CHAT IMPORT ─────────────────────────────────────────────────────────────
function importChatgpt(data) {
  try {
    const parsed = JSON.parse(data)
    const chats = {}
    const conversations = Array.isArray(parsed) ? parsed : [parsed]
    conversations.forEach(conv => {
      const modusId = 'chat'
      if (!chats[modusId]) chats[modusId] = []
      const nachrichten = []
      const mapping = conv.mapping || {}
      Object.values(mapping).forEach(node => {
        if (!node.message) return
        const msg = node.message
        if (!msg.content?.parts) return
        const text = msg.content.parts.join('').trim()
        if (!text) return
        const rolle = msg.author?.role === 'assistant' ? 'assistant' : 'user'
        nachrichten.push({ id: Date.now() + Math.random(), rolle, text, ts: (msg.create_time || 0) * 1000 })
      })
      if (nachrichten.length > 0) {
        chats[modusId].push({ id: conv.id || Date.now().toString(), modusId, ts: Date.now(), titel: conv.title || 'ChatGPT Import', nachrichten })
      }
    })
    return chats
  } catch { return null }
}

function importClueJson(data) {
  try {
    const parsed = JSON.parse(data)
    if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed
    return null
  } catch { return null }
}

function importTxt(data, filename) {
  const lines = data.split('\n').filter(l => l.trim())
  const nachrichten = lines.map((line, i) => ({ id: Date.now() + i, rolle: i % 2 === 0 ? 'user' : 'assistant', text: line.trim(), ts: Date.now() }))
  return { chat: [{ id: Date.now().toString(), modusId: 'chat', ts: Date.now(), titel: filename.replace(/\.(txt|md)$/, ''), nachrichten }] }
}

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
function SettingsModal({ isOpen, onClose, user, settings, onSettingsChange, chats, setChats, onLogout }) {
  const [aktiveTab, setAktiveTab] = useState('profil')
  const [savedFlash, setSavedFlash] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [displayName, setDisplayName] = useState(settings.displayName || user?.name || '')
  const [pwNeu, setPwNeu] = useState('')
  const [pwBestaetigung, setPwBestaetigung] = useState('')
  const [pwFehler, setPwFehler] = useState('')
  const [pwErfolg, setPwErfolg] = useState(false)
  const [showPwNeu, setShowPwNeu] = useState(false)
  const [importStatus, setImportStatus] = useState(null)
  const [importVorschau, setImportVorschau] = useState(null)
  const importInputRef = useRef(null)
  const [suchbegriff, setSuchbegriff] = useState('')
  const [neueAntwort, setNeueAntwort] = useState({ titel: '', text: '' })
  const [editId, setEditId] = useState(null)

  function update(key, val) {
    onSettingsChange(prev => { const next = { ...prev, [key]: val }; speichereSettings(next); return next })
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1200)
  }

  function updateSystemPrompt(modusId, val) {
    onSettingsChange(prev => { const next = { ...prev, systemPrompts: { ...prev.systemPrompts, [modusId]: val } }; speichereSettings(next); return next })
  }

  async function passwortAendern(e) {
    e.preventDefault(); setPwFehler(''); setPwErfolg(false)
    if (pwNeu !== pwBestaetigung) { setPwFehler('Passwörter stimmen nicht überein.'); return }
    if (pwNeu.length < 6) { setPwFehler('Mindestens 6 Zeichen.'); return }
    const { error } = await supabase.auth.updateUser({ password: pwNeu })
    if (error) { setPwFehler(error.message); return }
    setPwErfolg(true); setPwNeu(''); setPwBestaetigung('')
  }

  async function importDatei(e) {
    const file = e.target.files[0]; if (!file) return
    const text = await dateiLesen(file)
    if (!text) { setImportStatus({ typ: 'fehler', msg: 'Datei konnte nicht gelesen werden.' }); return }
    let importiert = null
    const name = file.name.toLowerCase()
    if (name.endsWith('.json')) importiert = importChatgpt(text) || importClueJson(text)
    else if (name.endsWith('.txt') || name.endsWith('.md')) importiert = importTxt(text, file.name)
    if (!importiert) { setImportStatus({ typ: 'fehler', msg: 'Format nicht erkannt.' }); return }
    const totalChats = Object.values(importiert).flat().length
    const totalNachrichten = Object.values(importiert).flat().reduce((a, c) => a + (c.nachrichten?.length || 0), 0)
    setImportVorschau({ daten: importiert, totalChats, totalNachrichten, dateiName: file.name })
    setImportStatus(null); e.target.value = ''
  }

  function importBestaetigen() {
    if (!importVorschau) return
    setChats(prev => {
      const next = { ...prev }
      Object.entries(importVorschau.daten).forEach(([modusId, chatList]) => { next[modusId] = [...(next[modusId] || []), ...chatList] })
      speichereChats(next); return next
    })
    setImportStatus({ typ: 'erfolg', msg: `${importVorschau.totalChats} Chats importiert.` })
    setImportVorschau(null)
  }

  function exportChats() {
    const blob = new Blob([JSON.stringify(chats, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `clue-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click(); URL.revokeObjectURL(url)
  }

  function vorlageSpeichern() {
    if (!neueAntwort.titel || !neueAntwort.text) return
    const liste = settings.schnellantworten || []
    if (editId) { update('schnellantworten', liste.map(a => a.id === editId ? { ...a, ...neueAntwort } : a)); setEditId(null) }
    else update('schnellantworten', [...liste, { id: Date.now().toString(), ...neueAntwort }])
    setNeueAntwort({ titel: '', text: '' })
  }

  const suchergebnisse = suchbegriff.trim().length > 1
    ? Object.values(chats).flat().filter(chat =>
        chat.nachrichten?.some(m => m.text?.toLowerCase().includes(suchbegriff.toLowerCase())) ||
        chat.titel?.toLowerCase().includes(suchbegriff.toLowerCase()))
    : []

  const totalNachrichten = Object.values(chats).flat().reduce((acc, c) => acc + (c.nachrichten?.length || 0), 0)
  const totalChats = Object.values(chats).flat().length

  const tabs = [
    { id: 'profil',             label: 'Profil',              icon: User },
    { id: 'personalisierung',   label: 'Personalisierung',    icon: Palette },
    { id: 'modell',             label: 'KI & Modell',         icon: Cpu },
    { id: 'systemprompts',      label: 'Systemprompts',       icon: Sliders },
    { id: 'schnellantworten',   label: 'Vorlagen',            icon: Zap },
    { id: 'suche',              label: 'Chat-Suche',          icon: Search },
    { id: 'import',             label: 'Import & Export',     icon: Upload },
    { id: 'integrationen',      label: 'Verbindungen',        icon: PlugZap },
    { id: 'passwort',           label: 'Passwort',            icon: Key },
    { id: 'benachrichtigungen', label: 'Benachrichtigungen',  icon: Bell },
    { id: 'sprache',            label: 'Sprache',             icon: Globe },
    { id: 'datenschutz',        label: 'Datenschutz',         icon: Shield },
    { id: 'shortcuts',          label: 'Tastenkürzel',        icon: Keyboard },
    { id: 'ueber',              label: 'Über Clue',           icon: Info },
  ]

  if (!isOpen) return null

  return (
    <div className="settings-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="settings-modal">
        <aside className="settings-sidebar">
          <div className="settings-sidebar-header">
            <span>Einstellungen</span>
            {savedFlash && <span className="saved-flash"><Check size={11} /> Gespeichert</span>}
          </div>
          <div className="settings-tabs-list">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} className={`settings-tab ${aktiveTab === tab.id ? 'aktiv' : ''}`} onClick={() => setAktiveTab(tab.id)}>
                  <Icon size={14} strokeWidth={1.8} /> {tab.label}
                </button>
              )
            })}
          </div>
          <div style={{ flex: 1 }} />
          <button className="settings-logout-btn" onClick={onLogout}><LogOut size={14} strokeWidth={1.8} /> Abmelden</button>
        </aside>

        <main className="settings-content">
          <button className="settings-close" onClick={onClose}><X size={16} /></button>

          {/* PROFIL */}
          {aktiveTab === 'profil' && (
            <div className="settings-section">
              <h2 className="settings-title">Profil</h2>
              <p className="settings-subtitle">Deine persönlichen Informationen</p>
              <div className="profile-card">
                <div className="profile-avatar-big" style={{ background: settings.avatarColor }}>
                  {(displayName || user?.name || 'U')[0].toUpperCase()}
                </div>
                <div className="profile-info">
                  <div className="profile-name">{displayName || user?.name}</div>
                  <div className="profile-email">{user?.email || '—'}</div>
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Anzeigename</div>
                <div className="settings-input-row">
                  <input className="settings-input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Dein Name" />
                  <button className="settings-btn-primary" onClick={() => update('displayName', displayName)}><Save size={13} /> Speichern</button>
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Avatar-Farbe</div>
                <div className="color-picker">
                  {['#818cf8', '#34d399', '#f472b6', '#fbbf24', '#60a5fa', '#a78bfa', '#fb923c', '#e879f9'].map(c => (
                    <button key={c} className={`color-dot ${settings.avatarColor === c ? 'aktiv' : ''}`} style={{ background: c }} onClick={() => update('avatarColor', c)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PERSONALISIERUNG */}
          {aktiveTab === 'personalisierung' && (
            <div className="settings-section">
              <h2 className="settings-title">Personalisierung</h2>
              <p className="settings-subtitle">Passe das Erscheinungsbild an</p>
              <div className="settings-group">
                <div className="settings-group-label">Erscheinungsbild</div>
                <SettingsRow label="Theme" desc="Hell oder Dunkel">
                  <SegmentedControl options={[{ value: 'dark', label: 'Dunkel' }, { value: 'light', label: 'Hell' }]} value={settings.theme} onChange={v => update('theme', v)} />
                </SettingsRow>
                <SettingsRow label="Schriftgröße">
                  <SegmentedControl options={[{ value: 'small', label: 'Klein' }, { value: 'medium', label: 'Mittel' }, { value: 'large', label: 'Groß' }]} value={settings.fontSize} onChange={v => update('fontSize', v)} />
                </SettingsRow>
                <SettingsRow label="Nachrichtenabstand">
                  <SegmentedControl options={[{ value: 'compact', label: 'Kompakt' }, { value: 'comfortable', label: 'Normal' }, { value: 'spacious', label: 'Weit' }]} value={settings.messageSpacing} onChange={v => update('messageSpacing', v)} />
                </SettingsRow>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Verhalten</div>
                <SettingsRow label="Animationen"><Toggle value={settings.animations} onChange={v => update('animations', v)} /></SettingsRow>
                <SettingsRow label="Kompakte Sidebar"><Toggle value={settings.compactSidebar} onChange={v => update('compactSidebar', v)} /></SettingsRow>
                <SettingsRow label="Zeitstempel anzeigen"><Toggle value={settings.showTimestamps} onChange={v => update('showTimestamps', v)} /></SettingsRow>
                <SettingsRow label="Enter zum Senden" desc="Shift+Enter für neue Zeile"><Toggle value={settings.sendOnEnter} onChange={v => update('sendOnEnter', v)} /></SettingsRow>
                <SettingsRow label="Automatische Chat-Titel"><Toggle value={settings.autoTitle} onChange={v => update('autoTitle', v)} /></SettingsRow>
              </div>
            </div>
          )}

          {/* MODELL */}
          {aktiveTab === 'modell' && (
            <div className="settings-section">
              <h2 className="settings-title">KI & Modell</h2>
              <p className="settings-subtitle">Konfiguriere das KI-Modell (Groq Cloud)</p>
              <div className="settings-group">
                <div className="settings-group-label">Modell auswählen</div>
                <div className="model-list">
                  {MODELLE.map(m => (
                    <button key={m.id} className={`model-card ${settings.model === m.id ? 'aktiv' : ''}`} onClick={() => update('model', m.id)}>
                      <div className="model-card-left">
                        <Cpu size={15} strokeWidth={1.8} />
                        <div><div className="model-name">{m.label}</div><div className="model-desc">{m.desc}</div></div>
                      </div>
                      {settings.model === m.id && <Check size={14} className="model-check" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Parameter</div>
                <SettingsRow label="Temperatur" desc={`Kreativität: ${settings.temperature}`}>
                  <div className="slider-wrap">
                    <span className="slider-label">0</span>
                    <input type="range" min="0" max="1" step="0.05" value={settings.temperature} onChange={e => update('temperature', parseFloat(e.target.value))} className="settings-slider" />
                    <span className="slider-label">1</span>
                  </div>
                </SettingsRow>
                <SettingsRow label="Max. Token" desc={`Antwortlänge: ${settings.maxTokens}`}>
                  <div className="slider-wrap">
                    <span className="slider-label">256</span>
                    <input type="range" min="256" max="4096" step="128" value={settings.maxTokens} onChange={e => update('maxTokens', parseInt(e.target.value))} className="settings-slider" />
                    <span className="slider-label">4096</span>
                  </div>
                </SettingsRow>
              </div>
            </div>
          )}

          {/* SYSTEMPROMPTS */}
          {aktiveTab === 'systemprompts' && (
            <div className="settings-section">
              <h2 className="settings-title">Systemprompts</h2>
              <p className="settings-subtitle">Gib jedem Modus eine eigene Persönlichkeit</p>
              {MODI.map(m => {
                const Icon = m.icon
                return (
                  <div key={m.id} className="settings-group">
                    <div className="settings-group-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Icon size={12} strokeWidth={2} /> {m.label}</span>
                      <button className="reset-btn" onClick={() => updateSystemPrompt(m.id, m.defaultSystem)}><RefreshCw size={11} /> Zurücksetzen</button>
                    </div>
                    <textarea className="systemprompt-textarea" value={settings.systemPrompts[m.id] || ''} onChange={e => updateSystemPrompt(m.id, e.target.value)} rows={4} />
                  </div>
                )
              })}
            </div>
          )}

          {/* VORLAGEN */}
          {aktiveTab === 'schnellantworten' && (
            <div className="settings-section">
              <h2 className="settings-title">Vorlagen</h2>
              <p className="settings-subtitle">Schnellantworten für häufige Anfragen</p>
              <div className="settings-group">
                <div className="settings-group-label">Neue Vorlage</div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="settings-input" placeholder="Titel" value={neueAntwort.titel} onChange={e => setNeueAntwort(p => ({ ...p, titel: e.target.value }))} />
                  <textarea className="systemprompt-textarea" placeholder="Text der Vorlage..." value={neueAntwort.text} onChange={e => setNeueAntwort(p => ({ ...p, text: e.target.value }))} rows={3} style={{ borderTop: 'none' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="settings-btn-primary" onClick={vorlageSpeichern}><Save size={13} /> {editId ? 'Aktualisieren' : 'Hinzufügen'}</button>
                    {editId && <button className="settings-btn-secondary" onClick={() => { setEditId(null); setNeueAntwort({ titel: '', text: '' }) }}>Abbrechen</button>}
                  </div>
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Gespeicherte Vorlagen</div>
                {(settings.schnellantworten || []).length === 0 && <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 12.5 }}>Noch keine Vorlagen.</div>}
                {(settings.schnellantworten || []).map(a => (
                  <div key={a.id} className="vorlage-item">
                    <div className="vorlage-left"><div className="vorlage-titel">{a.titel}</div><div className="vorlage-text">{a.text}</div></div>
                    <div className="vorlage-actions">
                      <button className="vorlage-btn" onClick={() => { setEditId(a.id); setNeueAntwort({ titel: a.titel, text: a.text }) }}><Sliders size={12} /></button>
                      <button className="vorlage-btn danger" onClick={() => update('schnellantworten', (settings.schnellantworten || []).filter(x => x.id !== a.id))}><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT SUCHE */}
          {aktiveTab === 'suche' && (
            <div className="settings-section">
              <h2 className="settings-title">Chat-Suche</h2>
              <p className="settings-subtitle">Durchsuche alle deine Gespräche</p>
              <div className="settings-group">
                <div className="settings-group-label">Suche</div>
                <div style={{ padding: '10px 14px' }}>
                  <div className="suche-input-wrap">
                    <Search size={14} className="suche-icon" />
                    <input className="suche-input" placeholder="Nachricht oder Chat-Titel suchen..." value={suchbegriff} onChange={e => setSuchbegriff(e.target.value)} autoFocus />
                    {suchbegriff && <button className="suche-clear" onClick={() => setSuchbegriff('')}><X size={12} /></button>}
                  </div>
                </div>
              </div>
              {suchbegriff.trim().length > 1 && (
                <div className="settings-group">
                  <div className="settings-group-label">{suchergebnisse.length} Ergebnisse</div>
                  {suchergebnisse.length === 0 && <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: 12.5 }}>Keine Treffer.</div>}
                  {suchergebnisse.slice(0, 10).map(chat => {
                    const treffer = chat.nachrichten?.filter(m => m.text?.toLowerCase().includes(suchbegriff.toLowerCase())) || []
                    const modus = MODI.find(m => m.id === chat.modusId)
                    const Icon = modus?.icon || MessageCircle
                    return (
                      <div key={chat.id} className="suchergebnis">
                        <div className="suchergebnis-header"><Icon size={12} strokeWidth={2} style={{ color: 'var(--text-muted)' }} /><span className="suchergebnis-titel">{chat.titel}</span><span className="suchergebnis-count">{treffer.length} Treffer</span></div>
                        {treffer.slice(0, 2).map((m, i) => {
                          const idx = m.text.toLowerCase().indexOf(suchbegriff.toLowerCase())
                          const start = Math.max(0, idx - 40)
                          return <div key={i} className="suchergebnis-snippet"><span className={`snippet-rolle ${m.rolle}`}>{m.rolle === 'user' ? 'Du' : 'Clue'}</span>{'...' + m.text.slice(start, start + 100) + '...'}</div>
                        })}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* IMPORT & EXPORT */}
          {aktiveTab === 'import' && (
            <div className="settings-section">
              <h2 className="settings-title">Import & Export</h2>
              <p className="settings-subtitle">Chats importieren oder exportieren</p>
              <div className="settings-group">
                <div className="settings-group-label">Chat importieren</div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p className="settings-hint" style={{ padding: 0 }}>Unterstützt: Clue JSON, ChatGPT Export, TXT, Markdown</p>
                  <div className="import-format-list">
                    {[{ label: 'Clue JSON', desc: 'Eigener Export' }, { label: 'ChatGPT Export', desc: 'conversations.json' }, { label: 'Textdatei (.txt)', desc: 'Zeilenweise' }, { label: 'Markdown (.md)', desc: 'Formatierter Text' }].map(f => (
                      <div key={f.label} className="import-format-item"><Check size={12} style={{ color: '#4ade80' }} /><div><div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)' }}>{f.label}</div><div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{f.desc}</div></div></div>
                    ))}
                  </div>
                  <input ref={importInputRef} type="file" style={{ display: 'none' }} accept=".json,.txt,.md" onChange={importDatei} />
                  <button className="settings-btn-secondary" onClick={() => importInputRef.current?.click()}><Upload size={14} /> Datei auswählen</button>
                  {importVorschau && (
                    <div className="import-vorschau">
                      <div className="import-vorschau-header"><FileText size={14} /><span>{importVorschau.dateiName}</span></div>
                      <div className="import-vorschau-stats"><span>{importVorschau.totalChats} Chats</span><span>{importVorschau.totalNachrichten} Nachrichten</span></div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        <button className="settings-btn-primary" onClick={importBestaetigen}><Download size={13} /> Importieren</button>
                        <button className="settings-btn-secondary" onClick={() => setImportVorschau(null)}>Abbrechen</button>
                      </div>
                    </div>
                  )}
                  {importStatus && <div className={`import-status ${importStatus.typ}`}>{importStatus.typ === 'erfolg' ? <Check size={13} /> : <AlertTriangle size={13} />}{importStatus.msg}</div>}
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Export</div>
                <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 24 }}>
                    <div><div className="data-stat-val">{totalChats}</div><div className="data-stat-label">Gespräche</div></div>
                    <div><div className="data-stat-val">{totalNachrichten}</div><div className="data-stat-label">Nachrichten</div></div>
                  </div>
                  <button className="settings-btn-secondary" onClick={exportChats}><Download size={14} /> Als Clue JSON exportieren</button>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONEN */}
          {aktiveTab === 'integrationen' && (
            <div className="settings-section">
              <h2 className="settings-title">Verbindungen</h2>
              <p className="settings-subtitle">Verbinde Clue mit externen Diensten</p>
              <div className="settings-group">
                <div className="settings-group-label">Verfügbare Integrationen</div>
                {INTEGRATIONEN.map(int => {
                  const Icon = int.icon
                  return (
                    <div key={int.id} className="integration-item">
                      <div className="integration-left"><div className="integration-icon"><Icon size={16} strokeWidth={1.8} /></div><div><div className="integration-name">{int.label}</div><div className="integration-desc">{int.desc}</div></div></div>
                      <div className="integration-right"><span className="coming-soon-badge">Bald</span></div>
                    </div>
                  )
                })}
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Info</div>
                <div style={{ padding: '14px 16px' }}><p className="settings-hint" style={{ padding: 0 }}>Weitere Integrationen wie Google Drive, Linear, Jira und mehr sind in Entwicklung.</p></div>
              </div>
            </div>
          )}

          {/* PASSWORT */}
          {aktiveTab === 'passwort' && (
            <div className="settings-section">
              <h2 className="settings-title">Passwort ändern</h2>
              <p className="settings-subtitle">Aktualisiere dein Konto-Passwort</p>
              <div className="settings-group">
                <div className="settings-group-label">Neues Passwort setzen</div>
                <form onSubmit={passwortAendern} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div className="pw-change-row">
                    <label>Neues Passwort</label>
                    <div className="pw-wrap-settings">
                      <input type={showPwNeu ? 'text' : 'password'} className="settings-input" value={pwNeu} onChange={e => setPwNeu(e.target.value)} placeholder="Mindestens 6 Zeichen" />
                      <button type="button" className="pw-toggle-settings" onClick={() => setShowPwNeu(!showPwNeu)}>{showPwNeu ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                    </div>
                  </div>
                  <div className="pw-change-row" style={{ borderBottom: 'none' }}>
                    <label>Bestätigung</label>
                    <div className="pw-wrap-settings"><input type="password" className="settings-input" value={pwBestaetigung} onChange={e => setPwBestaetigung(e.target.value)} placeholder="Passwort wiederholen" /></div>
                  </div>
                  {pwFehler && <div className="pw-fehler">{pwFehler}</div>}
                  {pwErfolg && <div className="pw-erfolg"><Check size={12} /> Passwort erfolgreich geändert.</div>}
                  <div style={{ padding: '12px 16px' }}><button type="submit" className="settings-btn-primary"><Key size={13} /> Passwort ändern</button></div>
                </form>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Hinweise</div>
                <div className="privacy-info">
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> Mindestens 8 Zeichen verwenden</div>
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> Buchstaben, Zahlen und Sonderzeichen kombinieren</div>
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> Passwort nie mit anderen teilen</div>
                </div>
              </div>
            </div>
          )}

          {/* BENACHRICHTIGUNGEN */}
          {aktiveTab === 'benachrichtigungen' && (
            <div className="settings-section">
              <h2 className="settings-title">Benachrichtigungen</h2>
              <p className="settings-subtitle">Steuere wann und wie du benachrichtigt wirst</p>
              <div className="settings-group">
                <div className="settings-group-label">Töne</div>
                <SettingsRow label="Ton bei Antwort"><Toggle value={settings.notifications?.sounds || false} onChange={v => update('notifications', { ...settings.notifications, sounds: v })} /></SettingsRow>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">In-App</div>
                <SettingsRow label="Antwort-Benachrichtigung"><Toggle value={settings.notifications?.chatResponse ?? true} onChange={v => update('notifications', { ...settings.notifications, chatResponse: v })} /></SettingsRow>
                <SettingsRow label="Mentions & Hinweise"><Toggle value={settings.notifications?.mentions ?? true} onChange={v => update('notifications', { ...settings.notifications, mentions: v })} /></SettingsRow>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Info</div>
                <div style={{ padding: '12px 16px' }}><p className="settings-hint" style={{ padding: 0 }}>Browser-Push-Benachrichtigungen kommen in einer zukünftigen Version.</p></div>
              </div>
            </div>
          )}

          {/* SPRACHE */}
          {aktiveTab === 'sprache' && (
            <div className="settings-section">
              <h2 className="settings-title">Sprache & Stimme</h2>
              <p className="settings-subtitle">Spracheingabe und Antwortsprache</p>
              <div className="settings-group">
                <div className="settings-group-label">Spracheingabe</div>
                <SettingsRow label="Erkennungssprache">
                  <select className="settings-select" value={settings.voiceLang} onChange={e => update('voiceLang', e.target.value)}>
                    <option value="de-DE">Deutsch</option>
                    <option value="en-US">Englisch (US)</option>
                    <option value="en-GB">Englisch (UK)</option>
                    <option value="fr-FR">Französisch</option>
                    <option value="es-ES">Spanisch</option>
                    <option value="it-IT">Italienisch</option>
                    <option value="tr-TR">Türkisch</option>
                    <option value="ar-SA">Arabisch</option>
                  </select>
                </SettingsRow>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Antwortsprache</div>
                <SettingsRow label="Bevorzugte Sprache">
                  <select className="settings-select" value={settings.responseLang} onChange={e => update('responseLang', e.target.value)}>
                    <option>Deutsch</option><option>Englisch</option><option>Französisch</option>
                    <option>Spanisch</option><option>Italienisch</option><option>Türkisch</option>
                    <option>Arabisch</option><option>Wie die Eingabe</option>
                  </select>
                </SettingsRow>
              </div>
            </div>
          )}

          {/* DATENSCHUTZ */}
          {aktiveTab === 'datenschutz' && (
            <div className="settings-section">
              <h2 className="settings-title">Datenschutz & Daten</h2>
              <p className="settings-subtitle">Verwalte deine gespeicherten Daten</p>
              <div className="settings-group">
                <div className="settings-group-label">Übersicht</div>
                <div className="data-stats">
                  <div className="data-stat"><div className="data-stat-val">{totalChats}</div><div className="data-stat-label">Gespräche</div></div>
                  <div className="data-stat"><div className="data-stat-val">{totalNachrichten}</div><div className="data-stat-label">Nachrichten</div></div>
                  <div className="data-stat"><div className="data-stat-val">{(JSON.stringify(chats).length / 1024).toFixed(1)} KB</div><div className="data-stat-label">Gespeichert</div></div>
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label" style={{ color: '#f87171' }}>Gefahrenzone</div>
                <div className="danger-card">
                  <div className="danger-card-left"><AlertTriangle size={18} style={{ color: '#f87171', flexShrink: 0 }} /><div><div className="danger-title">Alle Chats löschen</div><div className="danger-desc">Kann nicht rückgängig gemacht werden.</div></div></div>
                  {!deleteConfirm
                    ? <button className="settings-btn-danger" onClick={() => setDeleteConfirm(true)}><Trash2 size={13} /> Löschen</button>
                    : <div className="confirm-row"><span style={{ fontSize: 12, color: '#f87171' }}>Sicher?</span><button className="settings-btn-danger" onClick={() => { setChats({}); speichereChats({}); setDeleteConfirm(false) }}>Ja</button><button className="settings-btn-secondary" onClick={() => setDeleteConfirm(false)}>Nein</button></div>
                  }
                </div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Datenspeicherung</div>
                <div className="privacy-info">
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> Chats lokal im Browser gespeichert</div>
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> KI-Anfragen über Groq API (verschlüsselt)</div>
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> Supabase speichert nur Login-Daten</div>
                  <div className="privacy-item"><Check size={13} style={{ color: '#4ade80' }} /> Keine Weitergabe an Dritte</div>
                </div>
              </div>
            </div>
          )}

          {/* SHORTCUTS */}
          {aktiveTab === 'shortcuts' && (
            <div className="settings-section">
              <h2 className="settings-title">Tastenkürzel</h2>
              <p className="settings-subtitle">Schneller arbeiten mit Shortcuts</p>
              {[
                { label: 'Chat', items: [['Enter', 'Nachricht senden'], ['Shift + Enter', 'Neue Zeile']] },
                { label: 'Navigation', items: [['Cmd + K', 'Neuer Chat'], ['Cmd + ,', 'Einstellungen öffnen'], ['Esc', 'Schließen']] },
                { label: 'Features', items: [['Cmd + Shift + G', 'Google-Suche ein/aus'], ['Cmd + Shift + M', 'Mikrofon ein/aus'], ['Cmd + Shift + T', 'Theme wechseln']] },
              ].map(g => (
                <div key={g.label} className="settings-group">
                  <div className="settings-group-label">{g.label}</div>
                  {g.items.map(([key, desc]) => (
                    <div key={key} className="shortcut-row"><span className="shortcut-desc">{desc}</span><span className="shortcut-key">{key}</span></div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ÜBER */}
          {aktiveTab === 'ueber' && (
            <div className="settings-section">
              <h2 className="settings-title">Über Clue</h2>
              <p className="settings-subtitle">Dein persönlicher KI-Assistent</p>
              <div className="about-card">
                <div className="about-logo">Clue</div>
                <div className="about-version">Version 1.0.0</div>
                <div className="about-desc">Entwickelt mit React, Vite, Groq API und Supabase.</div>
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Tech Stack</div>
                {[['Frontend', 'React 18 + Vite'], ['KI-Engine', 'Groq Cloud API'], ['Auth & DB', 'Supabase'], ['Hosting', 'Vercel'], ['Suche', 'Google Custom Search API']].map(([k, v]) => (
                  <div key={k} className="about-row"><span className="about-key">{k}</span><span className="about-val">{v}</span></div>
                ))}
              </div>
              <div className="settings-group">
                <div className="settings-group-label">Aktuelle Konfiguration</div>
                {[['Modell', settings.model], ['Temperatur', settings.temperature], ['Max Token', settings.maxTokens], ['Theme', settings.theme === 'dark' ? 'Dunkel' : 'Hell']].map(([k, v]) => (
                  <div key={k} className="about-row"><span className="about-key">{k}</span><span className="about-val">{String(v)}</span></div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ─── MESSAGE BUBBLE ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isLast, onRegenerate, laedt, showTimestamps }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className={`nachricht ${msg.rolle}`}>
      {msg.rolle === 'assistant' && <div className="avatar">C</div>}
      <div className="msg-content">
        {msg.datei && (
          <div className="datei-vorschau">
            {msg.datei.typ === 'image' ? <img src={msg.datei.inhalt} alt={msg.datei.name} className="datei-bild" /> : <div className="datei-chip"><FileText size={13} /><span>{msg.datei.name}</span></div>}
          </div>
        )}
        <div className={`bubble ${msg.rolle === 'assistant' ? 'assistant-bubble' : ''}`}>
          {msg.rolle === 'assistant' ? <Markdown text={msg.text} /> : msg.text}
        </div>
        {showTimestamps && msg.ts && <span className="msg-timestamp">{new Date(msg.ts).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>}
        <div className="msg-actions">
          <button className="msg-action-btn" onClick={() => { navigator.clipboard?.writeText(msg.text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          {msg.rolle === 'assistant' && isLast && !laedt && <button className="msg-action-btn" onClick={onRegenerate}><RotateCcw size={12} /></button>}
        </div>
        {msg.quellen?.length > 0 && (
          <div className="quellen">
            <div className="quellen-titel">Quellen</div>
            {msg.quellen.map((q, qi) => <a key={qi} href={q.url} target="_blank" rel="noreferrer" className="quelle-link">{q.title}</a>)}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [passwort, setPasswort] = useState('')
  const [name, setName] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [fehler, setFehler] = useState('')
  const [laedt, setLaedt] = useState(false)

  async function submit(e) {
    e.preventDefault(); setFehler(''); setLaedt(true)
    try {
      if (tab === 'register') {
        const { error } = await supabase.auth.signUp({ email, password: passwort, options: { data: { name } } })
        if (error) throw error
        setFehler('Bestätigungs-E-Mail gesendet!')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: passwort })
        if (error) throw error
        onLogin({ name: data.user.user_metadata?.name || email, email: data.user.email })
      }
    } catch (err) { setFehler(err.message) }
    setLaedt(false)
  }

  async function googleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    if (error) setFehler(error.message)
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">Clue</div>
        <p className="auth-sub">{tab === 'login' ? 'Willkommen zurück' : 'Konto erstellen'}</p>
        <div className="social-btns">
          <button className="social-btn" onClick={googleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Mit Google fortfahren
          </button>
        </div>
        <div className="divider"><span>oder</span></div>
        <form onSubmit={submit} className="auth-form">
          {tab === 'register' && <div className="input-group"><label>Name</label><input type="text" placeholder="Dein Name" value={name} onChange={e => setName(e.target.value)} /></div>}
          <div className="input-group"><label>E-Mail</label><input type="email" placeholder="name@beispiel.de" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="input-group"><label>Passwort</label>
            <div className="pw-wrap">
              <input type={showPw ? 'text' : 'password'} placeholder="••••••••" value={passwort} onChange={e => setPasswort(e.target.value)} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button>
            </div>
          </div>
          {fehler && <p className={`auth-fehler ${fehler.includes('gesendet') ? 'success' : ''}`}>{fehler}</p>}
          <button type="submit" className="auth-submit" disabled={laedt}>
            {laedt ? 'Bitte warten...' : tab === 'login' ? 'Anmelden' : 'Registrieren'}
            {!laedt && <ChevronRight size={16} />}
          </button>
        </form>
        <p className="auth-switch">
          {tab === 'login' ? 'Noch kein Konto?' : 'Schon ein Konto?'}
          <button onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setFehler('') }}>
            {tab === 'login' ? ' Registrieren' : ' Anmelden'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── CHAT APP ─────────────────────────────────────────────────────────────────
function ChatApp({ user, onLogout }) {
  const [chats, setChats] = useState(ladeChats)
  const [settings, setSettings] = useState(ladeSettings)
  const [aktiverModusId, setAktiverModusId] = useState('chat')
  const [aktiverChatId, setAktiverChatId] = useState(null)
  const [eingabe, setEingabe] = useState('')
  const [laedt, setLaedt] = useState(false)
  const [webSucheAktiv, setWebSucheAktiv] = useState(false)
  const [hoert, setHoert] = useState(false)
  const [angehaegteDatei, setAngehaegteDatei] = useState(null)
  const [settingsOffen, setSettingsOffen] = useState(false)
  const [schnellMenuOffen, setSchnellMenuOffen] = useState(false)
  const bottomRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)
  const fileInputRef = useRef(null)

  const aktiverModus = MODI.find(m => m.id === aktiverModusId)
  const modusChats = chats[aktiverModusId] || []
  const aktiverChat = modusChats.find(c => c.id === aktiverChatId) || null
  const nachrichten = aktiverChat?.nachrichten || []

  useEffect(() => { document.body.setAttribute('data-theme', settings.theme) }, [settings.theme])
  useEffect(() => {
    const sizes = { small: '13px', medium: '14px', large: '16px' }
    document.documentElement.style.setProperty('--chat-font-size', sizes[settings.fontSize] || '14px')
  }, [settings.fontSize])
  useEffect(() => {
    const spacings = { compact: '4px', comfortable: '8px', spacious: '16px' }
    document.documentElement.style.setProperty('--msg-spacing', spacings[settings.messageSpacing] || '8px')
  }, [settings.messageSpacing])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [nachrichten, laedt])

  useEffect(() => {
    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); startNeuerChat() }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); setSettingsOffen(true) }
      if (e.key === 'Escape') { setSettingsOffen(false); setSchnellMenuOffen(false) }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'G') { e.preventDefault(); setWebSucheAktiv(p => !p) }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setSettings(p => { const next = { ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }; speichereSettings(next); return next })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = settings.voiceLang
    r.onresult = e => { setEingabe(p => p + e.results[0][0].transcript); setHoert(false) }
    r.onend = () => setHoert(false)
    r.onerror = () => setHoert(false)
    recognitionRef.current = r
  }, [settings.voiceLang])

  function toggleMic() {
    if (!recognitionRef.current) return
    if (hoert) { recognitionRef.current.stop(); setHoert(false) }
    else { recognitionRef.current.start(); setHoert(true) }
  }

  function autoResize() {
    const ta = textareaRef.current; if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }

  async function dateiAuswaehlen(e) {
    const file = e.target.files[0]; if (!file) return
    const inhalt = await dateiLesen(file)
    setAngehaegteDatei({ name: file.name, typ: file.type.startsWith('image/') ? 'image' : 'text', inhalt, groesse: (file.size / 1024).toFixed(1) + ' KB' })
    e.target.value = ''
  }

  function chatLoeschen(chatId) {
    setChats(prev => { const next = { ...prev, [aktiverModusId]: (prev[aktiverModusId] || []).filter(c => c.id !== chatId) }; speichereChats(next); return next })
    if (aktiverChatId === chatId) setAktiverChatId(null)
  }

  function startNeuerChat() {
    const chat = neuerChat(aktiverModusId)
    setChats(prev => { const next = { ...prev, [aktiverModusId]: [chat, ...(prev[aktiverModusId] || [])] }; speichereChats(next); return next })
    setAktiverChatId(chat.id)
  }

  async function apiCall(chatId, modusId, messages, systemPrompt, quellen) {
    const kiNachricht = { id: Date.now() + 1, rolle: 'assistant', text: '', quellen, ts: Date.now() }
    setChats(prev => {
      const updated = (prev[modusId] || []).map(c => c.id !== chatId ? c : { ...c, nachrichten: [...c.nachrichten, kiNachricht] })
      return { ...prev, [modusId]: updated }
    })

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: settings.model,
          max_tokens: settings.maxTokens,
          temperature: settings.temperature,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.rolle === 'user' ? 'user' : 'assistant', content: m.text })),
          ],
        }),
      })

      const data = await res.json()

      if (data.error) {
        throw new Error(data.error.message || 'Groq API Fehler')
      }

      const text = data.choices?.[0]?.message?.content || ''
      setChats(prev => {
        const updated = (prev[modusId] || []).map(c => {
          if (c.id !== chatId) return c
          const msgs = [...c.nachrichten]
          msgs[msgs.length - 1] = { ...kiNachricht, text }
          return { ...c, nachrichten: msgs }
        })
        const next = { ...prev, [modusId]: updated }; speichereChats(next); return next
      })

    } catch (fehler) {
      setChats(prev => {
        const updated = (prev[modusId] || []).map(c => {
          if (c.id !== chatId) return c
          const msgs = [...c.nachrichten]
          msgs[msgs.length - 1] = { ...kiNachricht, text: '❌ Fehler: ' + fehler.message }
          return { ...c, nachrichten: msgs }
        })
        const next = { ...prev, [modusId]: updated }; speichereChats(next); return next
      })
    }
  }

  async function nachrichtSenden(overrideText) {
    const frageText = overrideText || eingabe
    if (!frageText.trim() && !angehaegteDatei) return
    if (laedt) return

    let chatId = aktiverChatId; let currentNachrichten = nachrichten
    if (!chatId) {
      const chat = neuerChat(aktiverModusId); chatId = chat.id; currentNachrichten = []
      setAktiverChatId(chatId)
      setChats(prev => { const next = { ...prev, [aktiverModusId]: [chat, ...(prev[aktiverModusId] || [])] }; speichereChats(next); return next })
    }

    const dateiInfo = angehaegteDatei
    const neueNachricht = { id: Date.now(), rolle: 'user', text: frageText || `Analysiere: ${dateiInfo?.name}`, datei: dateiInfo, ts: Date.now() }
    const aktualisiert = [...currentNachrichten, neueNachricht]
    const modusId = aktiverModusId

    setChats(prev => {
      const updated = (prev[modusId] || []).map(c => {
        if (c.id !== chatId) return c
        const titel = (settings.autoTitle && c.nachrichten.length === 0) ? neueNachricht.text.split(' ').slice(0, 6).join(' ') + '...' : c.titel
        return { ...c, nachrichten: aktualisiert, titel }
      })
      const next = { ...prev, [modusId]: updated }; speichereChats(next); return next
    })

    setEingabe(''); setAngehaegteDatei(null); setSchnellMenuOffen(false)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLaedt(true)

    let quellen = []
    let systemPrompt = settings.systemPrompts[modusId] || aktiverModus.defaultSystem
    if (settings.responseLang !== 'Wie die Eingabe') systemPrompt += ` Antworte immer auf ${settings.responseLang}.`
    if (dateiInfo?.typ === 'text') systemPrompt += `\n\nHochgeladenes Dokument (${dateiInfo.name}):\n\n${dateiInfo.inhalt.slice(0, 8000)}`
    if (webSucheAktiv) {
      quellen = await webSuche(frageText)
      if (quellen.length > 0) systemPrompt += `\n\nInternetinfos:\n${quellen.map(q => `${q.title}: ${q.snippet}`).join('\n\n')}\n\nNenne die Quellen.`
    }

    await apiCall(chatId, modusId, aktualisiert, systemPrompt, quellen)
    setLaedt(false)
  }

  async function regenerate() {
    if (!aktiverChat || laedt || !nachrichten.length) return
    const ohneLetzte = nachrichten[nachrichten.length - 1]?.rolle === 'assistant' ? nachrichten.slice(0, -1) : nachrichten
    const letzteUser = ohneLetzte[ohneLetzte.length - 1]
    if (!letzteUser || letzteUser.rolle !== 'user') return
    setChats(prev => { const updated = (prev[aktiverModusId] || []).map(c => c.id !== aktiverChatId ? c : { ...c, nachrichten: ohneLetzte }); return { ...prev, [aktiverModusId]: updated } })
    setLaedt(true)
    await apiCall(aktiverChatId, aktiverModusId, ohneLetzte, settings.systemPrompts[aktiverModusId] || aktiverModus.defaultSystem, [])
    setLaedt(false)
  }

  return (
    <>
      <div className="app">
        <aside className={`sidebar ${settings.compactSidebar ? 'compact' : ''}`}>
          <div className="sidebar-top">
            <div className="logo">Clue</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button className="icon-btn theme-btn" onClick={() => setSettings(p => { const next = { ...p, theme: p.theme === 'dark' ? 'light' : 'dark' }; speichereSettings(next); return next })}>
                {settings.theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <button className="icon-btn theme-btn" onClick={() => setSettingsOffen(true)} title="Einstellungen (Cmd+,)">
                <Settings size={14} />
              </button>
            </div>
          </div>

          <div className="sidebar-section-label">Modi</div>
          <nav className="nav">
            {MODI.map(modus => {
              const Icon = modus.icon; const aktiv = aktiverModusId === modus.id
              const count = (chats[modus.id] || []).length
              return (
                <button key={modus.id} className={`nav-btn ${aktiv ? 'aktiv' : ''}`} onClick={() => { setAktiverModusId(modus.id); setAktiverChatId(null) }}>
                  <Icon size={15} strokeWidth={1.8} />
                  {!settings.compactSidebar && <span>{modus.label}</span>}
                  {count > 0 && <span className="badge">{count}</span>}
                </button>
              )
            })}
          </nav>

          {modusChats.length > 0 && !settings.compactSidebar && (
            <>
              <div className="sidebar-section-label" style={{ marginTop: 16 }}>Letzte Chats</div>
              <div className="chat-list">
                {modusChats.slice(0, 8).map(chat => (
                  <div key={chat.id} className={`chat-item ${aktiverChatId === chat.id ? 'aktiv' : ''}`} onClick={() => setAktiverChatId(chat.id)}>
                    <span className="chat-titel">{chat.titel}</span>
                    <button className="chat-delete" onClick={e => { e.stopPropagation(); chatLoeschen(chat.id) }}><Trash2 size={11} /></button>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="sidebar-spacer" />
          <div className="sidebar-footer">
            <div className="user-info">
              <div className="user-avatar" style={{ background: settings.avatarColor }}>
                {((settings.displayName || user?.name) || 'U')[0].toUpperCase()}
              </div>
              {!settings.compactSidebar && <span className="user-name">{settings.displayName || user?.name}</span>}
            </div>
            {!settings.compactSidebar && <button className="logout-btn" onClick={onLogout}>Abmelden</button>}
          </div>
        </aside>

        <main className="main">
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-header-titel">{aktiverChat ? aktiverChat.titel : aktiverModus.label}</span>
              <span className="modus-badge">
                {(() => { const Icon = aktiverModus.icon; return <Icon size={11} strokeWidth={2} /> })()}
                {aktiverModus.label}
              </span>
            </div>
            <button className="new-chat-btn" onClick={startNeuerChat}><Plus size={13} strokeWidth={2.5} /> Neuer Chat</button>
          </div>

          <div className="nachrichten">
            {nachrichten.length === 0 && (
              <div className="leer">
                <div className="leer-icon">{(() => { const Icon = aktiverModus.icon; return <Icon size={26} strokeWidth={1.2} /> })()}</div>
                <h2>Wie kann ich helfen?</h2>
                <p>Stell mir eine Frage oder wähle einen Vorschlag</p>
                <div className="suggestions">
                  {aktiverModus.suggestions.map((s, i) => <button key={i} className="suggestion-btn" onClick={() => nachrichtSenden(s)}>{s}</button>)}
                </div>
              </div>
            )}

            {nachrichten.map((msg, i) => (
              <MessageBubble key={msg.id || i} msg={msg} isLast={i === nachrichten.length - 1}
                onRegenerate={regenerate} laedt={laedt} showTimestamps={settings.showTimestamps} />
            ))}

            {laedt && nachrichten[nachrichten.length - 1]?.rolle !== 'assistant' && (
              <div className="nachricht assistant">
                <div className="avatar">C</div>
                <div className="bubble assistant-bubble"><LoadingAnimation /></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="eingabe-container">
            {angehaegteDatei && (
              <div className="datei-preview-bar">
                {angehaegteDatei.typ === 'image' ? <img src={angehaegteDatei.inhalt} alt={angehaegteDatei.name} className="preview-thumb" /> : <FileText size={14} className="preview-icon" />}
                <span className="preview-name">{angehaegteDatei.name}</span>
                <span className="preview-size">{angehaegteDatei.groesse}</span>
                <button className="preview-remove" onClick={() => setAngehaegteDatei(null)}><X size={13} /></button>
              </div>
            )}

            {schnellMenuOffen && (settings.schnellantworten || []).length > 0 && (
              <div className="schnell-menu">
                <div className="schnell-menu-header"><Zap size={12} /> Vorlagen</div>
                {(settings.schnellantworten || []).map(a => (
                  <button key={a.id} className="schnell-item" onClick={() => { setEingabe(a.text); setSchnellMenuOffen(false); textareaRef.current?.focus() }}>
                    <div className="schnell-titel">{a.titel}</div>
                    <div className="schnell-text">{a.text.slice(0, 60)}...</div>
                  </button>
                ))}
              </div>
            )}

            <div className="eingabe-box">
              <div className="modi-pills">
                {MODI.map(modus => {
                  const Icon = modus.icon; const aktiv = aktiverModusId === modus.id
                  return (
                    <button key={modus.id} className={`modus-pill ${aktiv ? 'aktiv' : ''}`} onClick={() => setAktiverModusId(modus.id)}>
                      <Icon size={11} strokeWidth={2} />{modus.label}
                    </button>
                  )
                })}
              </div>

              <textarea ref={textareaRef} value={eingabe}
                onChange={e => { setEingabe(e.target.value); autoResize() }}
                onKeyDown={e => { if (settings.sendOnEnter && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); nachrichtSenden() } }}
                placeholder={hoert ? 'Ich höre zu...' : 'Frag Clue etwas...'}
                rows={1}
              />

              <div className="eingabe-actions">
                <div className="left-actions">
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept=".txt,.md,.csv,.json,.pdf,image/*" onChange={dateiAuswaehlen} />
                  <button className={`icon-btn ${angehaegteDatei ? 'aktiv' : ''}`} onClick={() => fileInputRef.current?.click()} title="Datei anhängen">
                    <Paperclip size={14} strokeWidth={1.8} />
                  </button>
                  <button className={`icon-btn ${webSucheAktiv ? 'aktiv' : ''}`} onClick={() => setWebSucheAktiv(!webSucheAktiv)} title="Google Suche">
                    <Globe size={14} strokeWidth={1.8} />
                  </button>
                  {webSucheAktiv && <span className="web-badge">Google</span>}
                  <button className={`icon-btn ${schnellMenuOffen ? 'aktiv' : ''}`} onClick={() => setSchnellMenuOffen(!schnellMenuOffen)} title="Vorlagen">
                    <Zap size={14} strokeWidth={1.8} />
                  </button>
                </div>
                <div className="right-actions">
                  <button className={`icon-btn ${hoert ? 'mic-aktiv' : ''}`} onClick={toggleMic}>
                    {hoert ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button className="send-btn" onClick={() => nachrichtSenden()} disabled={laedt || (!eingabe.trim() && !angehaegteDatei)}>
                    <ArrowUp size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
            <p className="eingabe-hint">Clue kann Fehler machen. Wichtige Informationen immer prüfen.</p>
          </div>
        </main>
      </div>

      <SettingsModal isOpen={settingsOffen} onClose={() => setSettingsOffen(false)}
        user={user} settings={settings} onSettingsChange={setSettings}
        chats={chats} setChats={setChats} onLogout={onLogout} />
    </>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUser({ name: session.user.user_metadata?.name || session.user.email, email: session.user.email })
    })
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setUser({ name: session.user.user_metadata?.name || session.user.email, email: session.user.email })
      else setUser(null)
    })
  }, [])

  async function onLogout() { await supabase.auth.signOut(); setUser(null) }

  if (!user) return <LoginScreen onLogin={setUser} />
  return <ChatApp user={user} onLogout={onLogout} />
}
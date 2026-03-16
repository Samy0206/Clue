import { useState, useEffect } from 'react'
import { MessageCircle, FileText, GraduationCap, Code2, Calendar, Globe, Mic, Zap, ArrowRight, Check } from 'lucide-react'

const SLIDES = [
  {
    id: 0,
    tag: 'Willkommen',
    headline: 'Triff Clue.',
    sub: 'Dein persönlicher KI-Assistent — intelligent, schnell und immer verfügbar.',
    visual: (
      <div className="ob-hero-visual">
        <div className="ob-logo-big">C</div>
        <div className="ob-rings">
          <div className="ob-ring ob-ring-1" />
          <div className="ob-ring ob-ring-2" />
          <div className="ob-ring ob-ring-3" />
        </div>
        <div className="ob-orbits">
          {[MessageCircle, Code2, GraduationCap, Globe, Calendar].map((Icon, i) => (
            <div key={i} className={`ob-orbit-item ob-orbit-${i}`}>
              <Icon size={16} strokeWidth={1.8} />
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 1,
    tag: 'Modi',
    headline: 'Fünf Experten. Ein Assistent.',
    sub: 'Clue wechselt nahtlos zwischen Chat, Dokumente, Lernen, Code und Termine.',
    visual: (
      <div className="ob-modes-visual">
        {[
          { icon: MessageCircle, label: 'Chat',      color: '#818cf8', desc: 'Fragen, Ideen, Gespräche' },
          { icon: FileText,      label: 'Dokumente', color: '#34d399', desc: 'Texte analysieren & zusammenfassen' },
          { icon: GraduationCap, label: 'Lernen',    color: '#fbbf24', desc: 'Quizfragen & Erklärungen' },
          { icon: Code2,         label: 'Code',      color: '#60a5fa', desc: 'Schreiben, debuggen, verstehen' },
          { icon: Calendar,      label: 'Termine',   color: '#f472b6', desc: 'Planen & Zeitmanagement' },
        ].map((m, i) => {
          const Icon = m.icon
          return (
            <div key={i} className="ob-mode-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="ob-mode-icon" style={{ background: m.color + '22', color: m.color }}>
                <Icon size={18} strokeWidth={1.8} />
              </div>
              <div>
                <div className="ob-mode-label">{m.label}</div>
                <div className="ob-mode-desc">{m.desc}</div>
              </div>
            </div>
          )
        })}
      </div>
    ),
  },
  {
    id: 2,
    tag: 'Features',
    headline: 'Mehr als nur Chat.',
    sub: 'Websuche, Spracheingabe, Datei-Upload und smarte Vorlagen — alles in einem.',
    visual: (
      <div className="ob-features-visual">
        {[
          { icon: Globe,   color: '#60a5fa', label: 'Google-Suche',    desc: 'Aktuelle Infos direkt im Chat' },
          { icon: Mic,     color: '#f472b6', label: 'Spracheingabe',   desc: 'Einfach drauflosreden' },
          { icon: FileText,color: '#34d399', label: 'Datei-Upload',    desc: 'PDFs & Bilder analysieren' },
          { icon: Zap,     color: '#fbbf24', label: 'Vorlagen',        desc: 'Schnellantworten speichern' },
        ].map((f, i) => {
          const Icon = f.icon
          return (
            <div key={i} className="ob-feature-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="ob-feature-icon" style={{ background: f.color + '18', color: f.color }}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <div className="ob-feature-text">
                <div className="ob-feature-label">{f.label}</div>
                <div className="ob-feature-desc">{f.desc}</div>
              </div>
              <div className="ob-feature-check" style={{ color: f.color }}>
                <Check size={14} strokeWidth={2.5} />
              </div>
            </div>
          )
        })}
      </div>
    ),
  },
  {
    id: 3,
    tag: 'Privatsphäre',
    headline: 'Deine Daten gehören dir.',
    sub: 'Clue speichert alles lokal auf deinem Gerät. Kein Cloud-Zwang, keine Weitergabe.',
    visual: (
      <div className="ob-privacy-visual">
        <div className="ob-privacy-shield">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <path d="M40 8L12 20V38C12 54 24 68 40 72C56 68 68 54 68 38V20L40 8Z" fill="rgba(129,140,248,0.12)" stroke="#818cf8" strokeWidth="1.5" />
            <path d="M28 40L36 48L52 32" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="ob-privacy-items">
          {[
            'Chats lokal im Browser gespeichert',
            'KI-Anfragen verschlüsselt über Groq',
            'Supabase speichert nur Login-Daten',
            'Keine Weitergabe an Dritte',
          ].map((item, i) => (
            <div key={i} className="ob-privacy-item" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="ob-privacy-dot" />
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function Onboarding({ onFinish }) {
  const [aktiv, setAktiv] = useState(0)
  const [animating, setAnimating] = useState(false)

  function naechste() {
    if (animating) return
    if (aktiv < SLIDES.length - 1) {
      setAnimating(true)
      setTimeout(() => { setAktiv(a => a + 1); setAnimating(false) }, 300)
    } else {
      localStorage.setItem('clue-onboarding-done', '1')
      onFinish()
    }
  }

  function zuSlide(i) {
    if (animating || i === aktiv) return
    setAnimating(true)
    setTimeout(() => { setAktiv(i); setAnimating(false) }, 300)
  }

  const slide = SLIDES[aktiv]
  const isLast = aktiv === SLIDES.length - 1

  return (
    <div className="ob-screen">
      <div className="ob-bg-glow" />

      <div className="ob-card">
        {/* Progress dots */}
        <div className="ob-dots">
          {SLIDES.map((_, i) => (
            <button key={i} className={`ob-dot ${i === aktiv ? 'aktiv' : ''} ${i < aktiv ? 'done' : ''}`} onClick={() => zuSlide(i)} />
          ))}
        </div>

        {/* Tag */}
        <div className="ob-tag">{slide.tag}</div>

        {/* Visual */}
        <div className={`ob-visual-wrap ${animating ? 'fade-out' : 'fade-in'}`}>
          {slide.visual}
        </div>

        {/* Text */}
        <div className={`ob-text ${animating ? 'fade-out' : 'fade-in'}`}>
          <h1 className="ob-headline">{slide.headline}</h1>
          <p className="ob-sub">{slide.sub}</p>
        </div>

        {/* CTA */}
        <button className="ob-btn" onClick={naechste}>
          {isLast ? 'Loslegen' : 'Weiter'}
          <ArrowRight size={16} strokeWidth={2.5} className={isLast ? 'ob-btn-icon-spin' : ''} />
        </button>

        {/* Skip */}
        {!isLast && (
          <button className="ob-skip" onClick={() => { localStorage.setItem('clue-onboarding-done', '1'); onFinish() }}>
            Überspringen
          </button>
        )}
      </div>
    </div>
  )
}
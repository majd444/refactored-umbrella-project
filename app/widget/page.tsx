'use client'

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function WidgetPage() {
  return (
    <Suspense fallback={<div style={{ height: '100vh', width: '100vw', background: '#fff' }} />}> 
      <WidgetInner />
    </Suspense>
  )
}

function WidgetInner() {
  const searchParams = useSearchParams()
  const botId = useMemo(() => searchParams.get('botId') || '', [searchParams])
  // UI override parameters from iframe URL
  const overrides = useMemo(() => {
    const pick = (k: string) => {
      const v = searchParams.get(k)
      return v && v.trim().length > 0 ? v : undefined
    }
    return {
      name: pick('name'),
      headerColor: pick('headerColor'), 
      accentColor: pick('accentColor'),
      backgroundColor: pick('backgroundColor'),
      profileImage: pick('profileImage'),
      welcomeMessage: pick('welcomeMessage'),
    }
  }, [searchParams])
  const convexHttp = process.env.NEXT_PUBLIC_CONVEX_HTTP_URL || ''

  type Agent = {
    _id?: string
    name?: string
    welcomeMessage?: string
    headerColor?: string
    accentColor?: string
    backgroundColor?: string
    profileImage?: string
    collectUserInfo?: boolean
    formFields?: Array<{ id: string; type?: string; label?: string; required?: boolean; value?: string }>
  }

  const [agent, setAgent] = useState<Agent | null>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [hasBackend, setHasBackend] = useState<boolean>(false)
  const [messages, setMessages] = useState<Array<{ role: 'bot' | 'you'; text: string }>>([])
  const [input, setInput] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const [initError, setInitError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const init = async () => {
      if (!botId) {
        setInitError('Missing botId')
        setLoading(false)
        return
      }
      try {
        // 1) Fetch agent
        const agentUrl = `${convexHttp.replace(/\/$/, '')}/api/getAgent?botId=${encodeURIComponent(botId)}`
        const agentRes = await fetch(agentUrl)
        if (agentRes.ok) {
          const ag = (await agentRes.json()) as Agent
          // Merge overrides on top of Convex agent
          const merged: Agent = {
            ...ag,
            ...(overrides.name ? { name: overrides.name } : {}),
            ...(overrides.headerColor ? { headerColor: overrides.headerColor } : {}),
            ...(overrides.accentColor ? { accentColor: overrides.accentColor } : {}),
            ...(overrides.backgroundColor ? { backgroundColor: overrides.backgroundColor } : {}),
            ...(overrides.profileImage ? { profileImage: overrides.profileImage } : {}),
            ...(overrides.welcomeMessage ? { welcomeMessage: overrides.welcomeMessage } : {}),
          }
          setAgent(merged)
          const welcome = merged?.welcomeMessage || "👋 Hi! How can I help you today?"
          setMessages([{ role: 'bot', text: welcome }])

          // 2) Create session when backend available
          const sessRes = await fetch(`${convexHttp.replace(/\/$/, '')}/api/chat/widget/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentId: botId })
          })
          const sessData = await sessRes.json().catch(() => ({} as { sessionId?: string }))
          if (sessRes.ok && sessData.sessionId) {
            setSessionId(String(sessData.sessionId))
            setHasBackend(true)
          } else {
            setHasBackend(false)
          }
        } else {
          // Graceful fallback: render from overrides only (no backend)
          const merged: Agent = {
            name: overrides.name || 'Chatbot',
            headerColor: overrides.headerColor || '#2563eb',
            accentColor: overrides.accentColor || '#2563eb',
            backgroundColor: overrides.backgroundColor || '#ffffff',
            profileImage: overrides.profileImage,
            welcomeMessage: overrides.welcomeMessage || "👋 Hi! How can I help you today?",
            collectUserInfo: false,
          }
          setAgent(merged)
          setMessages([{ role: 'bot', text: merged.welcomeMessage! }])
          setHasBackend(false)
        }
      } catch (e) {
        console.error('[widget:init] error', e)
        // Render overrides-only if available; otherwise show error state
        if (overrides.name || overrides.welcomeMessage || overrides.headerColor || overrides.accentColor || overrides.backgroundColor || overrides.profileImage) {
          const merged: Agent = {
            name: overrides.name || 'Chatbot',
            headerColor: overrides.headerColor || '#2563eb',
            accentColor: overrides.accentColor || '#2563eb',
            backgroundColor: overrides.backgroundColor || '#ffffff',
            profileImage: overrides.profileImage,
            welcomeMessage: overrides.welcomeMessage || "👋 Hi! How can I help you today?",
            collectUserInfo: false,
          }
          setAgent(merged)
          setMessages([{ role: 'bot', text: merged.welcomeMessage! }])
          setHasBackend(false)
        } else {
          setInitError('Failed to initialize widget')
        }
      } finally {
        setLoading(false)
      }
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'you', text }])
    setInput('')

    try {
      if (!hasBackend || !sessionId) {
        setMessages((m) => [...m, { role: 'bot', text: 'Thanks! I will get back to you soon.' }])
        return
      }
      const res = await fetch(`${convexHttp.replace(/\/$/, '')}/api/chat/widget/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          agentId: botId,
          message: text,
          history: messages.map((m) => ({ role: m.role === 'you' ? 'user' : 'assistant', content: m.text })),
        })
      })
      const data = await res.json().catch(() => ({} as { reply?: string }))
      const reply = data?.reply || 'Sorry, I had trouble generating a response.'
      setMessages((m) => [...m, { role: 'bot', text: reply }])
    } catch (e) {
      console.error('[widget:send] error', e)
      setMessages((m) => [...m, { role: 'bot', text: '⚠️ Error contacting server' }])
    }
  }

  const close = () => {
    // Inform parent page to close the widget if it was opened via the embeddable script
    try {
      window.parent.postMessage('widget:close', '*')
    } catch {}
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        background: agent?.backgroundColor || '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
      }}
    >
      <div
        style={{
          background: agent?.headerColor || '#2563eb',
          color: '#fff',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {agent?.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={agent.profileImage} alt="bot" style={{ width: 22, height: 22, borderRadius: '50%' }} />
          ) : null}
          <span>{agent?.name || 'Chatbot'}</span>
          {botId && <span style={{ opacity: 0.8, fontWeight: 400, fontSize: 12, marginLeft: 6 }}>({botId})</span>}
        </div>
        <button
          aria-label="Close"
          onClick={close}
          style={{
            background: 'transparent',
            border: 0,
            color: '#fff',
            fontSize: 18,
            cursor: 'pointer',
          }}
        >
          ✖
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading…</div>
      ) : initError ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b91c1c' }}>{initError}</div>
      ) : (
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 16, lineHeight: 1.6 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <b>{m.role === 'bot' ? 'Bot' : 'You'}:</b> {m.text}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', borderTop: '1px solid #e5e7eb', padding: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send()
          }}
          placeholder="Type your message..."
          style={{ flex: 1, border: 0, outline: 'none', fontSize: 16, padding: '10px 12px' }}
        />
        <button
          onClick={send}
          style={{
            background: agent?.accentColor || '#2563eb',
            color: '#fff',
            border: 0,
            padding: '10px 16px',
            fontWeight: 700,
            borderRadius: 8,
            marginLeft: 8,
            cursor: 'pointer',
          }}
        >
          Send
        </button>
      </div>
    </div>
  )
}

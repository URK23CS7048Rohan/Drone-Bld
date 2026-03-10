'use client'
import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, Loader2, Trash2, Zap, Droplets, TrendingUp, AlertTriangle, Route } from 'lucide-react'

type Message = {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
    model?: string
}

const QUICK_PROMPTS = [
    { icon: AlertTriangle, label: 'Critical stock alert', prompt: 'Which blood types are critically low right now? What immediate actions should I take?' },
    { icon: TrendingUp, label: 'Demand forecast', prompt: 'Predict blood demand for the next 48 hours across Ramanathapuram district. Consider any upcoming festivals or weather patterns.' },
    { icon: Route, label: 'Optimize route', prompt: 'I need to deliver 4 units O- from Ramanathapuram Blood Bank to Paramakudi GH. What is the optimal drone and route? Consider battery levels.' },
    { icon: Droplets, label: 'Expiry management', prompt: 'Which blood units are expiring soon? Suggest reallocation to hospitals with highest demand for those types.' },
    { icon: Zap, label: 'Drone dispatch', prompt: 'BL-D3 is charging at 34%. BL-D1 and BL-D4 are idle. An emergency O- request just came from Rameswaram Govt Hospital. Which drone should I dispatch?' },
    { icon: Bot, label: 'Donor drive plan', prompt: 'AB- and A- are critically low. Plan a donor drive campaign for Ramanathapuram district — suggest locations, timing, and target demographics.' },
]

export default function AIAdvisorPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const endRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text?: string) => {
        const msg = text ?? input.trim()
        if (!msg || loading) return
        setInput('')

        const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: msg, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setLoading(true)

        try {
            const apiMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))

            const res = await fetch('/api/ai-advisor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: apiMessages }),
            })

            const data = await res.json()
            const aiMsg: Message = {
                id: `a-${Date.now()}`,
                role: 'assistant',
                content: data.response ?? data.error ?? 'No response received.',
                timestamp: new Date(),
                model: data.model,
            }
            setMessages(prev => [...prev, aiMsg])
        } catch {
            setMessages(prev => [...prev, {
                id: `e-${Date.now()}`, role: 'assistant',
                content: '❌ Failed to reach AI Advisor. Check your network connection.',
                timestamp: new Date()
            }])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // Simple markdown rendering for bold, bullets, code
    const renderMarkdown = (text: string) => {
        return text.split('\n').map((line, i) => {
            let html = line
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f1f5f9">$1</strong>')
                .replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.06);padding:2px 5px;border-radius:4px;font-size:12px;color:#a78bfa">$1</code>')
                .replace(/^- /, '• ')
                .replace(/^(\d+)\. /, '<span style="color:#60a5fa;font-weight:700">$1.</span> ')

            if (line.startsWith('🚨') || line.startsWith('⚠️') || line.startsWith('🩸') || line.startsWith('📊') || line.startsWith('🚁'))
                html = `<span style="font-size:14px">${html}</span>`

            return <div key={i} style={{ marginBottom: line === '' ? 8 : 2 }} dangerouslySetInnerHTML={{ __html: html }} />
        })
    }

    return (
        <div className="page" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 0px)' }}>
            {/* Header */}
            <div style={{ padding: '20px 30px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <div className="section-tag"><Sparkles size={12} /> AI Advisor</div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            BloodLine AI
                            <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(59,130,246,0.15))', border: '1px solid rgba(168,85,247,0.3)', color: '#a78bfa' }}>
                                Powered by Featherless AI
                            </span>
                        </h1>
                        <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>AI-powered blood logistics advisor for emergency hematology</p>
                    </div>
                    {messages.length > 0 && (
                        <button className="btn-ghost" onClick={() => setMessages([])} style={{ fontSize: 12 }}>
                            <Trash2 size={12} /> Clear Chat
                        </button>
                    )}
                </div>
            </div>

            {/* Chat area */}
            <div style={{ flex: 1, overflow: 'auto', padding: '24px 30px' }}>
                {messages.length === 0 ? (
                    /* Empty state with quick prompts */
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 36, marginTop: 20 }}>
                            <div style={{
                                width: 64, height: 64, borderRadius: 20, margin: '0 auto 16px',
                                background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(220,38,38,0.15))',
                                border: '1px solid rgba(168,85,247,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Sparkles size={28} color="#a855f7" />
                            </div>
                            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 6 }}>How can I help with blood logistics?</h2>
                            <p style={{ fontSize: 13, color: '#475569', maxWidth: 450, margin: '0 auto' }}>
                                Ask me about demand forecasting, route optimization, inventory management, or emergency protocols for the Ramanathapuram district network.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
                                <button
                                    key={label}
                                    onClick={() => sendMessage(prompt)}
                                    style={{
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)'; e.currentTarget.style.background = 'rgba(168,85,247,0.04)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <Icon size={14} color="#a855f7" />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
                                    </div>
                                    <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{prompt.slice(0, 80)}…</div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Message list */
                    <div style={{ maxWidth: 700, margin: '0 auto' }}>
                        {messages.map(m => (
                            <div key={m.id} style={{
                                display: 'flex', gap: 12, marginBottom: 20,
                                flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                            }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                    background: m.role === 'user' ? 'rgba(220,38,38,0.15)' : 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(59,130,246,0.15))',
                                    border: `1px solid ${m.role === 'user' ? 'rgba(220,38,38,0.3)' : 'rgba(168,85,247,0.25)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {m.role === 'user' ? <Droplets size={14} color="#f87171" /> : <Sparkles size={14} color="#a855f7" />}
                                </div>
                                <div style={{
                                    maxWidth: '80%', padding: '12px 16px', borderRadius: 14,
                                    background: m.role === 'user'
                                        ? 'rgba(220,38,38,0.08)'
                                        : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${m.role === 'user' ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.07)'}`,
                                }}>
                                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
                                        {m.role === 'assistant' ? renderMarkdown(m.content) : m.content}
                                    </div>
                                    <div style={{ fontSize: 10, color: '#334155', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {m.timestamp.toLocaleTimeString()}
                                        {m.model && <span style={{ background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: 4, color: '#a78bfa' }}>{m.model}</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                                <div style={{
                                    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                                    background: 'linear-gradient(135deg,rgba(168,85,247,0.15),rgba(59,130,246,0.15))',
                                    border: '1px solid rgba(168,85,247,0.25)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Sparkles size={14} color="#a855f7" />
                                </div>
                                <div style={{
                                    padding: '14px 18px', borderRadius: 14,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <Loader2 size={14} color="#a855f7" className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                                    <span style={{ fontSize: 13, color: '#475569' }}>Analyzing blood logistics data…</span>
                                </div>
                            </div>
                        )}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            {/* Input area */}
            <div style={{
                padding: '16px 30px 20px', borderTop: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(6,10,20,0.6)', backdropFilter: 'blur(12px)', flexShrink: 0,
            }}>
                <div style={{
                    maxWidth: 700, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'flex-end',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14, padding: '4px 4px 4px 16px',
                }}>
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask BloodLine AI about demand forecasting, routing, inventory..."
                        rows={1}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                            color: '#e2e8f0', fontSize: 14, padding: '10px 0', lineHeight: 1.5,
                            maxHeight: 120, fontFamily: 'inherit',
                        }}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={loading || !input.trim()}
                        style={{
                            width: 40, height: 40, borderRadius: 10, border: 'none', cursor: 'pointer',
                            background: input.trim() ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'rgba(255,255,255,0.05)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s', flexShrink: 0,
                            boxShadow: input.trim() ? '0 0 16px rgba(168,85,247,0.3)' : 'none',
                        }}
                    >
                        <Send size={16} color={input.trim() ? 'white' : '#334155'} />
                    </button>
                </div>
                <div style={{ maxWidth: 700, margin: '8px auto 0', fontSize: 11, color: '#334155', textAlign: 'center' }}>
                    Powered by <a href="https://featherless.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', textDecoration: 'none' }}>Featherless AI</a> — serverless open-source LLM inference
                </div>
            </div>

            <style jsx>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    )
}

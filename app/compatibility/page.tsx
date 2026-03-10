'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BLOOD_TYPES, getRankedDonors, type BloodType } from '@/lib/blood-compat'
import { MOCK_INVENTORY, MOCK_HOSPITALS } from '@/lib/mock-data'
import { FlaskConical, CheckCircle, XCircle, Send, Building2, Droplets, AlertTriangle, Radio, WifiOff, Sparkles } from 'lucide-react'

type BloodRequest = {
    id: string
    blood_type: string
    units: number
    hospital: string
    urgency: 'routine' | 'urgent' | 'critical'
    status: 'pending' | 'approved' | 'dispatched' | 'fulfilled'
    notes: string
    created_at: string
    antiA: boolean
    antiB: boolean
    antiD: boolean
    protocol: 'cloud' | 'v2x'
}

// In-memory request store (shared via localStorage for cross-tab sync)
function getRequests(): BloodRequest[] {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('blood_requests') ?? '[]') } catch { return [] }
}
function saveRequest(req: BloodRequest) {
    const all = getRequests()
    all.unshift(req)
    localStorage.setItem('blood_requests', JSON.stringify(all))
    // Dispatch storage event for receptionist tab
    window.dispatchEvent(new Event('storage'))
}

export default function CompatibilityPage() {
    const [recipient, setRecipient] = useState<BloodType>('O-')
    const [inventory, setInventory] = useState<Record<string, number>>({})
    const [serology, setSerology] = useState({ antiA: false, antiB: false, antiD: false })
    const [units, setUnits] = useState(2)
    const [hospital, setHospital] = useState('GH Ramanathapuram')
    const [urgency, setUrgency] = useState<'routine' | 'urgent' | 'critical'>('urgent')
    const [notes, setNotes] = useState('')
    const [protocol, setProtocol] = useState<'cloud' | 'v2x'>('cloud')
    const [sent, setSent] = useState(false)

    // AI Recommended Hospitals
    const [recommendedHospitals, setRecommendedHospitals] = useState<{ name: string, available: number, score: number }[]>([])

    const donors = getRankedDonors(recipient)

    // Update AI hospital recommendations when recipient or units change
    useEffect(() => {
        const typeIndex = BLOOD_TYPES.indexOf(recipient)
        const recs = MOCK_HOSPITALS.map((h, i) => {
            // Deterministic pseudo-random availability based on hospital + blood type
            let available = Math.max(0, Math.floor(((i + 1) * 11 + typeIndex * 7) % 35) - 5)
            // Major hubs (large capacity) have more stock
            if (h.capacity > 1000) available += 12

            let score = 0
            if (available >= units) {
                // High score if unit demand is fully met
                score = 85 + Math.min(14, (available - units) * 1.5) - (i * 0.8)
            } else if (available > 0) {
                // Partial fulfillment
                score = 45 + (available / units) * 30
            }

            return { name: h.name, available, score: Math.round(score) }
        })
            .filter(h => h.available > 0)
            .sort((a, b) => b.score - a.score) // Rank best to worst

        setRecommendedHospitals(recs)
        if (recs.length > 0 && !recs.find(r => r.name === hospital)) {
            setHospital(recs[0].name) // Auto-select top AI match
        }
    }, [recipient, units])

    // Determine blood group from antisera
    const determineBloodGroup = (a: boolean, b: boolean, d: boolean): BloodType => {
        if (a && b) return d ? 'AB+' : 'AB-'
        if (a && !b) return d ? 'A+' : 'A-'
        if (!a && b) return d ? 'B+' : 'B-'
        return d ? 'O+' : 'O-'
    }

    const updateSerology = (key: 'antiA' | 'antiB' | 'antiD', value: boolean) => {
        const next = { ...serology, [key]: value }
        setSerology(next)
        setRecipient(determineBloodGroup(next.antiA, next.antiB, next.antiD))
    }

    // Load inventory
    useEffect(() => {
        supabase.from('blood_inventory').select('blood_type, units').eq('status', 'available').then(({ data }) => {
            const byType: Record<string, number> = {}
            if (data?.length) {
                for (const r of data) byType[r.blood_type] = (byType[r.blood_type] ?? 0) + r.units
            } else {
                for (const r of MOCK_INVENTORY) byType[r.blood_type] = (byType[r.blood_type] ?? 0) + r.units
            }
            setInventory(byType)
        })
    }, [])

    const sendRequest = () => {
        const req: BloodRequest = {
            id: `BR-${Date.now()}`,
            blood_type: recipient,
            units,
            hospital,
            urgency,
            notes,
            status: 'pending',
            created_at: new Date().toISOString(),
            antiA: serology.antiA,
            antiB: serology.antiB,
            antiD: serology.antiD,
            protocol,
        }
        saveRequest(req)
        setSent(true)
        setTimeout(() => setSent(false), 4000)
    }

    const HOSPITALS = MOCK_HOSPITALS.map(h => h.name)
    const URGENCY_STYLES = {
        routine: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.3)' },
        urgent: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)' },
        critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
    }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
                <div className="section-tag"><FlaskConical size={12} /> Compatibility</div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Blood Group Serology & Request</h1>
                <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Determine blood type via antisera testing → send request to receptionist dashboard</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left: Serology Test + Request Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Serology Test */}
                    <div className="card card-glow">
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FlaskConical size={15} color="#a855f7" /> Blood Group Serology Test
                        </h3>
                        <p style={{ fontSize: '11px', color: '#475569', marginBottom: '18px' }}>
                            Enter agglutination results from antisera testing
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            {([
                                { key: 'antiA' as const, label: 'Anti-A', color: '#3b82f6', desc: 'Detects A antigen' },
                                { key: 'antiB' as const, label: 'Anti-B', color: '#f59e0b', desc: 'Detects B antigen' },
                                { key: 'antiD' as const, label: 'Anti-D (Rh)', color: '#10b981', desc: 'Detects Rh factor' },
                            ] as const).map(({ key, label, color, desc }) => (
                                <div key={key} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    padding: '12px 14px', borderRadius: '12px',
                                    background: serology[key] ? `${color}11` : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${serology[key] ? `${color}44` : 'rgba(255,255,255,0.06)'}`,
                                    transition: 'all 0.3s',
                                }}>
                                    {/* Agglutination circle */}
                                    <div style={{
                                        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                                        background: serology[key]
                                            ? `radial-gradient(circle at 30% 30%, ${color}55, ${color}22)`
                                            : 'rgba(255,255,255,0.04)',
                                        border: `2px solid ${serology[key] ? color : 'rgba(255,255,255,0.08)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 16, color: serology[key] ? color : '#334155',
                                    }}>
                                        {serology[key] ? '⊕' : '○'}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: serology[key] ? color : '#94a3b8' }}>{label}</div>
                                        <div style={{ fontSize: 10, color: '#475569' }}>{desc}</div>
                                    </div>

                                    {/* +/- toggle */}
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        <button onClick={() => updateSerology(key, true)} style={{
                                            padding: '7px 14px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                                            border: `1px solid ${serology[key] === true ? `${color}88` : 'rgba(255,255,255,0.1)'}`,
                                            background: serology[key] === true ? `${color}22` : 'rgba(255,255,255,0.02)',
                                            color: serology[key] === true ? color : '#475569',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}>+</button>
                                        <button onClick={() => updateSerology(key, false)} style={{
                                            padding: '7px 14px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                                            border: `1px solid ${serology[key] === false ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                                            background: serology[key] === false ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.02)',
                                            color: serology[key] === false ? '#f87171' : '#475569',
                                            cursor: 'pointer', transition: 'all 0.15s',
                                        }}>−</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Result */}
                        <div style={{
                            padding: '14px', borderRadius: 12, textAlign: 'center',
                            background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(168,85,247,0.06))',
                            border: '1px solid rgba(220,38,38,0.25)',
                        }}>
                            <div style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 600 }}>
                                Determined Blood Group
                            </div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: '#f87171', letterSpacing: '-1px' }}>
                                {recipient}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                Anti-A: {serology.antiA ? '⊕' : '⊖'} · Anti-B: {serology.antiB ? '⊕' : '⊖'} · Anti-D: {serology.antiD ? '⊕' : '⊖'}
                            </div>
                        </div>

                        {/* Network Protocol */}
                        <div style={{ marginBottom: 20 }}>
                            <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Network Protocol
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <button onClick={() => setProtocol('cloud')} style={{
                                    padding: '10px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    background: protocol === 'cloud' ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${protocol === 'cloud' ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    color: protocol === 'cloud' ? '#60a5fa' : '#475569', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                                }}>
                                    <Send size={14} /> 5G Cloud
                                </button>
                                <button onClick={() => setProtocol('v2x')} style={{
                                    padding: '10px', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                    background: protocol === 'v2x' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${protocol === 'v2x' ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    color: protocol === 'v2x' ? '#fcd34d' : '#475569', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                                    boxShadow: protocol === 'v2x' ? '0 0 10px rgba(245,158,11,0.1)' : 'none',
                                }}>
                                    {protocol === 'v2x' ? <Radio size={14} className="pulse-icon" /> : <WifiOff size={14} />} V2X Mesh
                                </button>
                            </div>
                            {protocol === 'v2x' && (
                                <div style={{ marginTop: 8, fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.05)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)', display: 'flex', gap: 6 }}>
                                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span>Operating offline. Request will be routed via local drone-to-drone (V2V) and RSU (V2I) mesh network.</span>
                                </div>
                            )}
                        </div>
                        <style jsx>{`
                            @keyframes pulse { 0% { opacity: 1; text-shadow: 0 0 0px #f59e0b; } 50% { opacity: 0.6; text-shadow: 0 0 8px #f59e0b; } 100% { opacity: 1; text-shadow: 0 0 0px #f59e0b; } }
                            :global(.pulse-icon) { animation: pulse 2s infinite ease-in-out; }
                        `}</style>
                    </div>

                    {/* Blood Request Form */}
                    <div className="card">
                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Send size={15} color="#10b981" /> Send Blood Request
                        </h3>

                        {/* AI Sourcing Hospital selector */}
                        <div style={{ marginBottom: 14 }}>
                            <label style={{ fontSize: 11, color: '#a855f7', fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                <Sparkles size={11} /> AI Prediction Model: Optimal Sourcing
                            </label>

                            {recommendedHospitals.length > 0 ? (
                                <div style={{ position: 'relative' }}>
                                    <select value={hospital} onChange={e => setHospital(e.target.value)} style={{
                                        width: '100%', padding: '12px 14px', borderRadius: 10,
                                        background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.3)',
                                        color: '#e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer',
                                        appearance: 'none', fontWeight: 600,
                                    }}>
                                        {recommendedHospitals.map(h => (
                                            <option key={h.name} value={h.name} style={{ background: '#0d1220', color: '#f1f5f9' }}>
                                                {h.name} ({h.available} {recipient} units avail) — {h.score}% Match Score
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                                        {hospital === recommendedHospitals[0]?.name && (
                                            <span style={{ fontSize: 9, background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 800 }}>BEST MATCH</span>
                                        )}
                                        <span style={{ fontSize: 10 }}>▼</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <XCircle size={14} /> No hospitals currently have {recipient} available.
                                </div>
                            )}
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, marginLeft: 2 }}>
                                AI automatically ranks & selects nearest hubs with sufficient {recipient} inventory.
                            </div>
                        </div>

                        {/* Units + Urgency row */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <Droplets size={10} style={{ display: 'inline', marginRight: 4 }} /> Units Needed
                                </label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button onClick={() => setUnits(Math.max(1, units - 1))} style={{
                                        width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: 18, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>−</button>
                                    <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', minWidth: 40, textAlign: 'center' }}>{units}</div>
                                    <button onClick={() => setUnits(Math.min(20, units + 1))} style={{
                                        width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.03)', color: '#94a3b8', fontSize: 18, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>+</button>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    <AlertTriangle size={10} style={{ display: 'inline', marginRight: 4 }} /> Urgency
                                </label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    {(['routine', 'urgent', 'critical'] as const).map(u => {
                                        const s = URGENCY_STYLES[u]
                                        return (
                                            <button key={u} onClick={() => setUrgency(u)} style={{
                                                padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s',
                                                background: urgency === u ? s.bg : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${urgency === u ? s.border : 'rgba(255,255,255,0.08)'}`,
                                                color: urgency === u ? s.color : '#475569',
                                            }}>{u}</button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ fontSize: 11, color: '#475569', fontWeight: 600, marginBottom: 6, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Notes (optional)
                            </label>
                            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Emergency surgery, patient #1234"
                                style={{
                                    width: '100%', padding: '10px 12px', borderRadius: 10,
                                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#e2e8f0', fontSize: 13, outline: 'none',
                                }} />
                        </div>

                        {/* Send button */}
                        <button onClick={sendRequest} className="btn-blood" style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            background: sent ? 'rgba(16,185,129,0.15)' : undefined,
                            borderColor: sent ? 'rgba(16,185,129,0.4)' : undefined,
                            color: sent ? '#34d399' : undefined,
                        }}>
                            {sent ? <><CheckCircle size={14} /> Request Sent to Receptionist!</> : <><Send size={14} /> Send Blood Request</>}
                        </button>

                        {sent && (
                            <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, fontSize: 12, color: '#34d399' }}>
                                ✅ Request for <strong>{units}× {recipient}</strong> sent to receptionist at <strong>{hospital}</strong> ({urgency} priority)
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Cross-match results */}
                <div className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FlaskConical size={15} color="#3b82f6" /> Cross-Match Results
                    </h3>
                    <p style={{ fontSize: '12px', color: '#475569', marginBottom: '20px' }}>
                        Patient type: <strong style={{ color: '#f87171' }}>{recipient}</strong> — Ranked compatible donors from live inventory
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {donors.map(d => {
                            const avail = inventory[d.type] ?? 0
                            const barW = Math.min((d.score / 100) * 100, 100)
                            return (
                                <div key={d.type} style={{
                                    padding: '12px 16px', borderRadius: '10px',
                                    background: d.compatible ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${d.compatible ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                    opacity: d.compatible ? 1 : 0.4,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                        <span className="blood-chip">{d.type}</span>
                                        <div style={{ flex: 1 }}>
                                            <div className="progress-bar">
                                                <div style={{
                                                    height: '100%', borderRadius: '3px', width: `${barW}%`, transition: 'width 0.5s ease',
                                                    background: d.score === 100 ? 'linear-gradient(90deg,#065f46,#10b981)' : d.score > 0 ? 'linear-gradient(90deg,#1e3a5f,#3b82f6)' : 'transparent'
                                                }} />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '80px', justifyContent: 'flex-end' }}>
                                            {d.compatible ? <CheckCircle size={14} color="#34d399" /> : <XCircle size={14} color="#475569" />}
                                            <span style={{ fontSize: '13px', fontWeight: 700, color: d.score === 100 ? '#34d399' : d.score > 0 ? '#60a5fa' : '#334155' }}>{d.score}%</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                                        <span>{d.score === 100 ? 'Exact match' : d.score >= 90 ? 'Compatible — same Rh' : d.score > 0 ? 'Cross-compatible' : 'Incompatible'}</span>
                                        <span style={{ color: avail === 0 ? '#dc2626' : avail < 15 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                                            {avail} units avail.
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.17)', borderRadius: '8px', fontSize: '12px', color: '#60a5fa' }}>
                        ℹ️ Scores based on ABO + Rh compatibility matrix. Inventory from live data / mock fallback.
                    </div>
                </div>
            </div>
        </div>
    )
}

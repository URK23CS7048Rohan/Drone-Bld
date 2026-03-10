'use client'
import { useState, useEffect, useCallback } from 'react'
import { ClipboardList, CheckCircle, Truck, Clock, AlertTriangle, Droplets, Building2, Trash2, RefreshCw, Send, Radio } from 'lucide-react'

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
    protocol?: 'cloud' | 'v2x'
}

function getRequests(): BloodRequest[] {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('blood_requests') ?? '[]') } catch { return [] }
}

export default function ReceptionistPage() {
    const [requests, setRequests] = useState<BloodRequest[]>([])
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'dispatched' | 'fulfilled'>('all')

    const refresh = useCallback(() => setRequests(getRequests()), [])

    useEffect(() => {
        refresh()
        const onStorage = () => refresh()
        window.addEventListener('storage', onStorage)
        const interval = setInterval(refresh, 2000) // poll every 2s
        return () => {
            window.removeEventListener('storage', onStorage)
            clearInterval(interval)
        }
    }, [refresh])

    const updateStatus = (id: string, status: BloodRequest['status']) => {
        const all = getRequests().map(r => r.id === id ? { ...r, status } : r)
        localStorage.setItem('blood_requests', JSON.stringify(all))
        setRequests(all)
    }

    const deleteRequest = (id: string) => {
        const all = getRequests().filter(r => r.id !== id)
        localStorage.setItem('blood_requests', JSON.stringify(all))
        setRequests(all)
    }

    const clearAll = () => {
        localStorage.setItem('blood_requests', '[]')
        setRequests([])
    }

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
    const pending = requests.filter(r => r.status === 'pending').length
    const approved = requests.filter(r => r.status === 'approved').length
    const dispatched = requests.filter(r => r.status === 'dispatched').length
    const fulfilled = requests.filter(r => r.status === 'fulfilled').length

    const URGENCY = {
        routine: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: '🔵 Routine' },
        urgent: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: '🟡 Urgent' },
        critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: '🔴 Critical' },
    }

    const STATUS = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', icon: Clock, label: 'Pending' },
        approved: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', icon: CheckCircle, label: 'Approved' },
        dispatched: { color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', icon: Truck, label: 'Dispatched' },
        fulfilled: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)', icon: CheckCircle, label: 'Fulfilled' },
    }

    const formatTime = (iso: string) => {
        const d = new Date(iso)
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' · ' + d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
    }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px' }}>
                <div>
                    <div className="section-tag"><ClipboardList size={12} /> Receptionist</div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Receptionist Dashboard</h1>
                    <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Manage incoming blood requests from serology tests</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" onClick={refresh}><RefreshCw size={12} /> Refresh</button>
                    {requests.length > 0 && <button className="btn-ghost" onClick={clearAll}><Trash2 size={12} /> Clear All</button>}
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {([
                    { label: 'Pending', value: pending, color: '#f59e0b', icon: Clock },
                    { label: 'Approved', value: approved, color: '#3b82f6', icon: CheckCircle },
                    { label: 'Dispatched', value: dispatched, color: '#a855f7', icon: Truck },
                    { label: 'Fulfilled', value: fulfilled, color: '#10b981', icon: CheckCircle },
                ] as const).map(({ label, value, color, icon: Icon }) => (
                    <div key={label} className="card" style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Icon size={12} color={color} /> {label}
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                    </div>
                ))}
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {(['all', 'pending', 'approved', 'dispatched', 'fulfilled'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                        padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        textTransform: 'capitalize', cursor: 'pointer', transition: 'all 0.15s',
                        background: filter === f ? 'rgba(220,38,38,0.12)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${filter === f ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.06)'}`,
                        color: filter === f ? '#f87171' : '#475569',
                    }}>{f === 'all' ? `All (${requests.length})` : `${f} (${requests.filter(r => r.status === f).length})`}</button>
                ))}
            </div>

            {/* Request list */}
            {filtered.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <ClipboardList size={40} color="#1e293b" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#334155', marginBottom: 6 }}>No Blood Requests</div>
                    <div style={{ fontSize: 13, color: '#475569' }}>
                        Requests made from the <strong>Compatibility</strong> page will appear here in real-time
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {filtered.map(req => {
                        const urg = URGENCY[req.urgency]
                        const stat = STATUS[req.status]
                        const StatIcon = stat.icon
                        return (
                            <div key={req.id} className="card" style={{
                                padding: '18px 22px',
                                borderLeft: `4px solid ${urg.color}`,
                                animation: req.status === 'pending' && req.urgency === 'critical' ? 'pulse-border 2s infinite' : 'none',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        {/* Blood type chip */}
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 18, fontWeight: 900, color: '#f87171',
                                        }}>{req.blood_type}</div>
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {req.units} units of {req.blood_type}
                                                <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: urg.bg, color: urg.color }}>
                                                    {urg.label}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                                <Building2 size={11} /> {req.hospital}
                                                <span style={{ color: '#1e293b' }}>·</span>
                                                <Clock size={11} /> {formatTime(req.created_at)}
                                                <span style={{ color: '#1e293b' }}>·</span>
                                                {req.protocol === 'v2x' ? (
                                                    <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                                                        <Radio size={11} className="pulse-icon" /> V2X Mesh Routed
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Send size={11} /> 5G Cloud
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {/* Status badge */}
                                        <span style={{
                                            padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                            background: stat.bg, border: `1px solid ${stat.border}`, color: stat.color,
                                            display: 'flex', alignItems: 'center', gap: 4,
                                        }}>
                                            <StatIcon size={12} /> {stat.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Serology info */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 12, color: '#64748b' }}>
                                    <span>Serology: Anti-A {req.antiA ? '⊕' : '⊖'} · Anti-B {req.antiB ? '⊕' : '⊖'} · Anti-D {req.antiD ? '⊕' : '⊖'}</span>
                                    {req.notes && <><span style={{ color: '#1e293b' }}>·</span><span>📝 {req.notes}</span></>}
                                </div>

                                {/* Action buttons */}
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {req.status === 'pending' && (
                                        <button onClick={() => updateStatus(req.id, 'approved')} style={{
                                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)',
                                            color: '#60a5fa', cursor: 'pointer',
                                        }}>✓ Approve</button>
                                    )}
                                    {req.status === 'approved' && (
                                        <button onClick={() => updateStatus(req.id, 'dispatched')} style={{
                                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                            background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
                                            color: '#a78bfa', cursor: 'pointer',
                                        }}>🚁 Dispatch Drone</button>
                                    )}
                                    {req.status === 'dispatched' && (
                                        <button onClick={() => updateStatus(req.id, 'fulfilled')} style={{
                                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                                            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                                            color: '#34d399', cursor: 'pointer',
                                        }}>📦 Mark Delivered</button>
                                    )}
                                    <button onClick={() => deleteRequest(req.id)} style={{
                                        padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, marginLeft: 'auto',
                                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#475569', cursor: 'pointer',
                                    }}>✕ Remove</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <style jsx>{`
                @keyframes pulse-border {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.3); }
                    50% { box-shadow: 0 0 12px 2px rgba(239,68,68,0.2); }
                }
                @keyframes pulse { 0% { opacity: 1; text-shadow: 0 0 0px #f59e0b; } 50% { opacity: 0.6; text-shadow: 0 0 8px #f59e0b; } 100% { opacity: 1; text-shadow: 0 0 0px #f59e0b; } }
                :global(.pulse-icon) { animation: pulse 2s infinite ease-in-out; }
            `}</style>
        </div>
    )
}

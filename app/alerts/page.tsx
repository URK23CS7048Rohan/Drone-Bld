'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_ALERTS } from '@/lib/mock-data'
import { AlertTriangle, CheckCircle, RefreshCw, Bell } from 'lucide-react'

type Alert = {
    id: string; type: string; message: string; severity: string; resolved: boolean; created_at: string
}

const TYPE_ICONS: Record<string, string> = {
    low_stock: '🩸', expiring_soon: '⏰', drone_fault: '🤖', delivery_failed: '❌', critical_demand: '🚨'
}

export default function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active')

    const load = useCallback(async () => {
        setLoading(true)
        let q = supabase.from('alerts').select('*').order('created_at', { ascending: false })
        if (filter === 'active') q = q.eq('resolved', false)
        if (filter === 'resolved') q = q.eq('resolved', true)
        const { data } = await q
        if (data?.length) {
            setAlerts(data)
        } else {
            const mockFiltered = filter === 'all' ? MOCK_ALERTS
                : filter === 'active' ? MOCK_ALERTS.filter(a => !a.resolved)
                    : MOCK_ALERTS.filter(a => a.resolved)
            setAlerts(mockFiltered as Alert[])
        }
        setLoading(false)
    }, [filter])

    useEffect(() => { load() }, [load])
    useEffect(() => {
        const ch = supabase.channel('alerts-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, load)
            .subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [load])

    const resolve = async (id: string) => {
        await supabase.from('alerts').update({ resolved: true }).eq('id', id)
        load()
    }

    const SEV_CLASS: Record<string, string> = { critical: 'badge-critical', warning: 'badge-warning', info: 'badge-info' }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
                <div className="section-tag"><Bell size={12} /> Alerts</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Alert Center</h1>
                        <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Live system events — Supabase Realtime</p>
                    </div>
                    <button className="btn-ghost" onClick={load}><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {(['all', 'active', 'resolved'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={filter === f ? 'btn-blood' : 'btn-ghost'}
                        style={{ padding: '8px 18px', fontSize: '13px', textTransform: 'capitalize' }}>
                        {f}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ color: '#334155', textAlign: 'center', padding: '60px', fontSize: '14px' }}>Loading alerts…</div>
            ) : alerts.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <CheckCircle size={40} color="#34d399" />
                    <div style={{ fontSize: '16px', color: '#34d399', fontWeight: 600 }}>All clear</div>
                    <div style={{ fontSize: '13px', color: '#334155' }}>No {filter} alerts</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alerts.map(a => (
                        <div key={a.id} className="card" style={{
                            padding: '20px',
                            borderColor: a.severity === 'critical' ? 'rgba(220,38,38,0.3)' : a.severity === 'warning' ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.07)',
                            opacity: a.resolved ? 0.5 : 1,
                        }}>
                            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                                <div style={{ fontSize: '28px', lineHeight: 1, flexShrink: 0 }}>{TYPE_ICONS[a.type] ?? '⚠️'}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                                        <span className={`badge ${SEV_CLASS[a.severity] ?? 'badge-info'}`}>{a.severity}</span>
                                        <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.type.replace(/_/g, ' ')}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#334155' }}>{new Date(a.created_at).toLocaleString()}</span>
                                    </div>
                                    <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>{a.message}</p>
                                </div>
                                {!a.resolved && (
                                    <button onClick={() => resolve(a.id)}
                                        style={{ flexShrink: 0, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                                        <CheckCircle size={12} /> Resolve
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#334155' }}>{alerts.length} alerts shown</span>
                <button className="btn-ghost" style={{ fontSize: '12px' }} onClick={async () => {
                    await supabase.from('alerts').insert({
                        type: 'low_stock', severity: 'warning',
                        message: `Manual test alert — ${new Date().toLocaleTimeString()}`,
                    })
                    load()
                }}>
                    <AlertTriangle size={12} /> Trigger Test Alert
                </button>
            </div>
        </div>
    )
}

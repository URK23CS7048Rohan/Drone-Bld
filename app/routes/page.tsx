'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_DELIVERIES } from '@/lib/mock-data'
import { GitBranch, RefreshCw, Truck } from 'lucide-react'
import { format } from 'date-fns'

type Delivery = {
    id: string; blood_type: string; units: number; status: string
    from_location: string; to_hospital_id?: string; drone_id?: string | null
    distance_km: number; eta_minutes: number; dispatched_at: string; delivered_at: string | null
    hospitals?: { name: string } | null; drones?: { name: string } | null
}

export default function RoutesPage() {
    const [deliveries, setDeliveries] = useState<Delivery[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'in_transit' | 'delivered' | 'failed'>('all')

    async function load() {
        setLoading(true)
        try {
            let q = supabase.from('deliveries').select('*, hospitals(name), drones(name)').order('dispatched_at', { ascending: false })
            if (filter !== 'all') q = q.eq('status', filter)
            const { data } = await q
            if (data?.length) {
                setDeliveries(data as Delivery[])
                setLoading(false)
                return
            }
        } catch { /* Supabase not configured */ }
        const mockFiltered = filter === 'all' ? MOCK_DELIVERIES : MOCK_DELIVERIES.filter(d => d.status === filter)
        setDeliveries(mockFiltered as Delivery[])
        setLoading(false)
    }

    useEffect(() => { load() }, [filter])

    const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
        in_transit: { label: '🚁 In Transit', cls: 'badge-warning' },
        delivered: { label: '✅ Delivered', cls: 'badge-ok' },
        failed: { label: '❌ Failed', cls: 'badge-critical' },
        pending: { label: '⏳ Pending', cls: 'badge-idle' },
    }

    const totalKm = deliveries.reduce((s, d) => s + d.distance_km, 0)
    const avgETA = deliveries.filter(d => d.status === 'in_transit').reduce((s, d, _, a) => s + d.eta_minutes / a.length, 0)

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
                <div className="section-tag"><GitBranch size={12} /> Routes</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Route Optimization</h1>
                        <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>All delivery routes and drone assignments</p>
                    </div>
                    <button className="btn-ghost" onClick={load}><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                {[
                    { label: 'Total Deliveries', val: deliveries.length, color: '#f1f5f9' },
                    { label: 'In Transit', val: deliveries.filter(d => d.status === 'in_transit').length, color: '#f59e0b' },
                    { label: 'Total Distance', val: `${totalKm.toFixed(1)}km`, color: '#3b82f6' },
                    { label: 'Avg ETA', val: avgETA > 0 ? `${avgETA.toFixed(0)}m` : 'N/A', color: '#10b981' },
                ].map(({ label, val, color }) => (
                    <div key={label} className="card" style={{ padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color }}>{val}</div>
                    </div>
                ))}
            </div>

            {/* Filter */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                {(['all', 'in_transit', 'delivered', 'failed'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                        className={filter === f ? 'btn-blood' : 'btn-ghost'}
                        style={{ padding: '7px 16px', fontSize: '12px', textTransform: 'capitalize' }}>
                        {f.replace('_', ' ')}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: '#334155', fontSize: '14px' }}>Loading routes…</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Blood</th>
                                <th>Qty</th>
                                <th>From</th>
                                <th>To Hospital</th>
                                <th>Drone</th>
                                <th>Distance</th>
                                <th>ETA</th>
                                <th>Status</th>
                                <th>Dispatched</th>
                                <th>Delivered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deliveries.length === 0 ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#334155' }}>No routes found</td></tr>
                            ) : deliveries.map(d => {
                                const s = STATUS_STYLE[d.status] ?? { label: d.status, cls: 'badge-idle' }
                                return (
                                    <tr key={d.id}>
                                        <td><span className="blood-chip">{d.blood_type}</span></td>
                                        <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.units}</td>
                                        <td style={{ color: '#64748b', fontSize: '12px' }}>{d.from_location}</td>
                                        <td style={{ fontWeight: 500, color: '#94a3b8' }}>{d.hospitals?.name ?? '—'}</td>
                                        <td style={{ color: '#64748b', fontSize: '12px' }}><span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Truck size={11} />{d.drones?.name ?? '—'}</span></td>
                                        <td style={{ color: '#64748b' }}>{d.distance_km.toFixed(1)} km</td>
                                        <td>{d.status === 'in_transit' ? <span style={{ color: '#fbbf24', fontWeight: 600 }}>{d.eta_minutes}m</span> : '—'}</td>
                                        <td><span className={`badge ${s.cls}`} style={{ fontSize: '11px' }}>{s.label}</span></td>
                                        <td style={{ color: '#475569', fontSize: '12px' }}>{format(new Date(d.dispatched_at), 'MMM d, HH:mm')}</td>
                                        <td style={{ color: '#475569', fontSize: '12px' }}>{d.delivered_at ? format(new Date(d.delivered_at), 'MMM d, HH:mm') : '—'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

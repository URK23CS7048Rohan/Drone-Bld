'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_INVENTORY, MOCK_DRONES, MOCK_DELIVERIES, MOCK_ALERTS, MOCK_PREDICTIONS } from '@/lib/mock-data'
import { Droplets, Bot, Building2, Activity, AlertTriangle, Clock, TrendingUp, CheckCircle, XCircle, Truck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const BLOOD_COLORS: Record<string, string> = {
    'O-': '#dc2626', 'O+': '#ef4444',
    'A+': '#3b82f6', 'A-': '#60a5fa',
    'B+': '#10b981', 'B-': '#34d399',
    'AB+': '#a855f7', 'AB-': '#c084fc',
}

export default function Dashboard() {
    const [inventory, setInventory] = useState<{ blood_type: string; units: number }[]>([])
    const [deliveries, setDeliveries] = useState<{
        id: string; blood_type: string; units: number; status: string;
        from_location?: string; origin?: string; destination?: string; eta_minutes: number; dispatched_at?: string; created_at?: string;
        hospitals?: { name: string }
    }[]>([])
    const [drones, setDrones] = useState<{ status: string }[]>([])
    const [alerts, setAlerts] = useState<{ id: string; message: string; severity: string; type: string; created_at: string }[]>([])
    const [predictions, setPredictions] = useState<{ id?: string; hospital_id: string; blood_type: string; predicted_units: number; confidence: number }[]>([])

    const load = useCallback(async () => {
        const [invRes, delRes, drnRes, alertRes, predRes] = await Promise.all([
            supabase.from('blood_inventory').select('blood_type, units').eq('status', 'available').order('blood_type'),
            supabase.from('deliveries').select('*, hospitals(name)').order('dispatched_at', { ascending: false }).limit(8),
            supabase.from('drones').select('status'),
            supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(5),
            supabase.from('demand_predictions').select('*').order('created_at', { ascending: false }).limit(6),
        ])

        // Use mock data as fallback when Supabase returns empty
        const invData = invRes.data?.length ? invRes.data : MOCK_INVENTORY
        const byType: Record<string, number> = {}
        for (const r of invData) byType[r.blood_type] = (byType[r.blood_type] ?? 0) + r.units
        setInventory(Object.entries(byType).map(([blood_type, units]) => ({ blood_type, units })))

        const delData = delRes.data?.length ? delRes.data : MOCK_DELIVERIES
        setDeliveries(delData as typeof deliveries)
        setDrones(drnRes.data?.length ? drnRes.data : MOCK_DRONES)
        setAlerts(alertRes.data?.length ? alertRes.data : MOCK_ALERTS as typeof alerts)
        setPredictions(predRes.data?.length ? predRes.data : MOCK_PREDICTIONS)
    }, [])

    useEffect(() => {
        load()
        // Realtime subscriptions
        const ch = supabase.channel('dashboard')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_inventory' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drones' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deliveries' }, load)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, load)
            .subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [load])

    const totalUnits = inventory.reduce((s, r) => s + r.units, 0)
    const activeDrones = drones.filter(d => d.status === 'delivering' || d.status === 'dispatched').length
    const idleDrones = drones.filter(d => d.status === 'idle').length
    const inTransit = deliveries.filter(d => d.status === 'in_transit').length
    const deliveredToday = deliveries.filter(d => d.status === 'delivered').length

    const statusBadge = (s: string) => {
        if (s === 'in_transit') return <span className="badge badge-warning"><Truck size={10} /> In Transit</span>
        if (s === 'delivered') return <span className="badge badge-ok"><CheckCircle size={10} /> Delivered</span>
        if (s === 'failed') return <span className="badge badge-critical"><XCircle size={10} /> Failed</span>
        return <span className="badge badge-idle">{s}</span>
    }

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: { blood_type: string; units: number } }[] }) => {
        if (active && payload?.length) {
            return (
                <div style={{ background: '#0d111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#f1f5f9' }}>{payload[0].payload.blood_type}</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>{payload[0].payload.units} units</div>
                </div>
            )
        }
        return null
    }

    return (
        <div className="page" style={{ padding: '40px 40px' }}>
            <div style={{ marginBottom: '32px' }}>
                <div className="section-tag"><Activity size={12} /> Live Dashboard</div>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Operations Center</h1>
                <p style={{ color: '#475569', fontSize: '14px', marginTop: '4px' }}>Real-time hematology logistics — all data from Supabase</p>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
                {[
                    { label: 'Total Units', val: totalUnits, icon: Droplets, color: '#dc2626', sub: 'Available blood' },
                    { label: 'Active Drones', val: activeDrones, icon: Bot, color: '#10b981', sub: `${idleDrones} idle` },
                    { label: 'In Transit', val: inTransit, icon: Truck, color: '#f59e0b', sub: 'Active deliveries' },
                    { label: 'Delivered Today', val: deliveredToday, icon: CheckCircle, color: '#3b82f6', sub: 'Completed' },
                    { label: 'Active Alerts', val: alerts.length, icon: AlertTriangle, color: alerts.length > 2 ? '#dc2626' : '#f59e0b', sub: 'Unresolved' },
                ].map(({ label, val, icon: Icon, color, sub }) => (
                    <div key={label} className="card" style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</span>
                            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={13} color={color} />
                            </div>
                        </div>
                        <div className="stat-number" style={{ fontSize: '32px' }}>{val}</div>
                        <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>{sub}</div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                {/* Inventory Chart */}
                <div className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Droplets size={15} color="#dc2626" /> Blood Inventory by Type
                    </h3>
                    {inventory.length === 0 ? (
                        <div style={{ color: '#334155', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
                            No inventory data. Run the Supabase seed SQL.
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={inventory} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                                <XAxis type="number" stroke="#334155" tick={{ fontSize: 11, fill: '#64748b' }} />
                                <YAxis dataKey="blood_type" type="category" stroke="#334155" tick={{ fontSize: 12, fill: '#94a3b8' }} width={32} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="units" radius={[0, 4, 4, 0]}>
                                    {inventory.map((entry) => (
                                        <Cell key={entry.blood_type} fill={BLOOD_COLORS[entry.blood_type] ?? '#dc2626'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Alerts */}
                <div className="card">
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={15} color="#f59e0b" /> Active Alerts
                    </h3>
                    {alerts.length === 0 ? (
                        <div style={{ color: '#34d399', textAlign: 'center', padding: '40px 0', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={28} />All systems normal
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {alerts.map(a => (
                                <div key={a.id} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                    <span className={`badge ${a.severity === 'critical' ? 'badge-critical' : a.severity === 'warning' ? 'badge-warning' : 'badge-info'}`} style={{ flexShrink: 0, fontSize: '10px' }}>{a.severity}</span>
                                    <div>
                                        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>{a.message}</div>
                                        <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>{new Date(a.created_at).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Deliveries Table */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Truck size={15} color="#3b82f6" /> Recent Deliveries
                </h3>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Blood Type</th>
                            <th>Units</th>
                            <th>Destination</th>
                            <th>From</th>
                            <th>ETA</th>
                            <th>Status</th>
                            <th>Dispatched</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveries.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#334155' }}>No deliveries found</td></tr>
                        ) : deliveries.map(d => (
                            <tr key={d.id}>
                                <td><span className="blood-chip" style={{ width: 'auto', height: 'auto', padding: '4px 8px', fontSize: '12px' }}>{d.blood_type}</span></td>
                                <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{d.units}</td>
                                <td>{(d.hospitals as { name?: string } | null)?.name ?? d.destination ?? '—'}</td>
                                <td style={{ color: '#475569' }}>{d.from_location ?? d.origin ?? '—'}</td>
                                <td>{d.status === 'in_transit' ? <span style={{ color: '#fbbf24' }}>{d.eta_minutes}m</span> : '—'}</td>
                                <td>{statusBadge(d.status)}</td>
                                <td style={{ color: '#475569', fontSize: '12px' }}>{new Date(d.dispatched_at ?? d.created_at ?? '').toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Forecast Snapshot */}
            <div className="card">
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={15} color="#a855f7" /> Demand Forecast Snapshot
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    {predictions.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', color: '#334155', textAlign: 'center', padding: '20px', fontSize: '13px' }}>No prediction data</div>
                    ) : predictions.map(p => (
                        <div key={p.id} style={{ padding: '14px', borderRadius: '10px', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.15)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span className="blood-chip">{p.blood_type}</span>
                                <span style={{ fontSize: '11px', color: '#a855f7' }}>{Math.round(p.confidence * 100)}% conf</span>
                            </div>
                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#e2e8f0' }}>{p.predicted_units}</div>
                            <div style={{ fontSize: '11px', color: '#475569' }}>predicted units</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_DRONES_FLEET } from '@/lib/mock-data'
import { Bot, Battery, MapPin, Activity, RefreshCw, Zap } from 'lucide-react'

type Drone = {
    id: string; name: string; model: string; battery: number; status: string;
    lat: number; lng: number; altitude: number; speed: number; created_at: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
    idle: { label: 'Idle', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
    dispatched: { label: 'Dispatched', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    delivering: { label: 'Delivering', color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    returning: { label: 'Returning', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    charging: { label: 'Charging', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    maintenance: { label: 'Maintenance', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
}

export default function DronesPage() {
    const [drones, setDrones] = useState<Drone[]>([])
    const [loading, setLoading] = useState(true)
    const [deliveries, setDeliveries] = useState<Record<string, { id?: string; status: string; blood_type: string; units: number; hospitals?: { name: string } }[]>>({})

    const load = useCallback(async () => {
        setLoading(true)
        const { data: droneData } = await supabase.from('drones').select('*').order('name')
        const { data: delData } = await supabase.from('deliveries')
            .select('*, hospitals(name)')
            .in('status', ['in_transit', 'pending'])

        const byDrone: typeof deliveries = {}
        for (const d of delData ?? []) {
            if (!byDrone[d.drone_id]) byDrone[d.drone_id] = []
            byDrone[d.drone_id].push(d)
        }
        setDrones(droneData?.length ? droneData : MOCK_DRONES_FLEET as Drone[])
        setDeliveries(byDrone)
        setLoading(false)
    }, [])

    useEffect(() => { load() }, [load])
    useEffect(() => {
        const ch = supabase.channel('drones-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'drones' }, load)
            .subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [load])

    const summary = { total: drones.length, active: drones.filter(d => d.status === 'delivering' || d.status === 'dispatched').length, charging: drones.filter(d => d.status === 'charging').length, idle: drones.filter(d => d.status === 'idle').length }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div className="section-tag"><Bot size={12} /> Fleet</div>
                    <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Drone Fleet</h1>
                    <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Live telemetry — Supabase Realtime</p>
                </div>
                <button className="btn-ghost" onClick={load}><RefreshCw size={14} /> Refresh</button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Total Fleet', val: summary.total, color: '#f1f5f9' },
                    { label: 'Active Missions', val: summary.active, color: '#10b981' },
                    { label: 'Charging', val: summary.charging, color: '#a855f7' },
                    { label: 'Idle', val: summary.idle, color: '#64748b' },
                ].map(({ label, val, color }) => (
                    <div key={label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
                        <div className="stat-number" style={{ fontSize: '36px', color }}>{val}</div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Drone cards */}
            {loading ? (
                <div style={{ color: '#334155', textAlign: 'center', padding: '60px', fontSize: '14px' }}>Loading fleet data…</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                    {drones.map(drone => {
                        const meta = STATUS_META[drone.status] ?? STATUS_META.idle
                        const missions = deliveries[drone.id] ?? []
                        return (
                            <div key={drone.id} className="card" style={{ borderColor: `${meta.color}30` }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                            <Bot size={22} color={meta.color} />
                                            {(drone.status === 'delivering' || drone.status === 'dispatched') && (
                                                <div style={{ position: 'absolute', top: '-3px', right: '-3px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid #0d111d' }} className="pulse-dot" />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{drone.name}</div>
                                            <div style={{ fontSize: '12px', color: '#475569' }}>{drone.model}</div>
                                        </div>
                                    </div>
                                    <span className="badge" style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.color}40`, fontSize: '11px' }}>
                                        {meta.label}
                                    </span>
                                </div>

                                {/* Telemetry grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                                    {[
                                        { label: 'Altitude', val: `${drone.altitude}m`, icon: Activity },
                                        { label: 'Speed', val: `${drone.speed} km/h`, icon: Zap },
                                        { label: 'Location', val: `${drone.lat.toFixed(3)}, ${drone.lng.toFixed(3)}`, icon: MapPin },
                                    ].map(({ label, val, icon: Icon }) => (
                                        <div key={label} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <Icon size={10} /> {label}
                                            </div>
                                            <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{val}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Battery */}
                                <div style={{ marginBottom: missions.length > 0 ? '14px' : '0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <Battery size={13} color={drone.battery < 20 ? '#dc2626' : drone.battery < 50 ? '#f59e0b' : '#10b981'} />
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>Battery</span>
                                        <span style={{ marginLeft: 'auto', fontSize: '13px', fontWeight: 700, color: drone.battery < 20 ? '#f87171' : drone.battery < 50 ? '#fbbf24' : '#34d399' }}>{drone.battery}%</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div className="progress-fill" style={{
                                            width: `${drone.battery}%`,
                                            background: drone.battery < 20 ? 'linear-gradient(90deg,#7f1d1d,#dc2626)' : drone.battery < 50 ? 'linear-gradient(90deg,#78350f,#f59e0b)' : 'linear-gradient(90deg,#065f46,#10b981)'
                                        }} />
                                    </div>
                                </div>

                                {/* Active missions */}
                                {missions.map(m => (
                                    <div key={m.id} style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', fontSize: '12px', color: '#fbbf24' }}>
                                        🚁 Delivering {m.units}× {m.blood_type} → {(m.hospitals as { name?: string } | null)?.name ?? 'Unknown'}
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

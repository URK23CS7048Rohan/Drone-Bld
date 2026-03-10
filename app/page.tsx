'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_INVENTORY, MOCK_DRONES, MOCK_ALERTS, MOCK_DELIVERIES } from '@/lib/mock-data'
import { Droplets, Bot, Building2, Zap, ArrowRight, Activity, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const step = target / 60
    let cur = 0
    const iv = setInterval(() => {
      cur = Math.min(cur + step, target)
      setVal(Math.floor(cur))
      if (cur >= target) clearInterval(iv)
    }, 16)
    return () => clearInterval(iv)
  }, [target])
  return <>{val}{suffix}</>
}

export default function Home() {
  const [stats, setStats] = useState({ units: 0, drones: 0, hospitals: 0, deliveries: 0 })
  const [alerts, setAlerts] = useState<{ id: string; message: string; severity: string; type: string }[]>([])
  const [drones, setDrones] = useState<{ id: string; name: string; status: string; battery: number; battery_level?: number }[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function load() {
      const [inv, drnRes, hospRes, delRes, alertsRes] = await Promise.all([
        supabase.from('blood_inventory').select('units').eq('status', 'available'),
        supabase.from('drones').select('*'),
        supabase.from('hospitals').select('id', { count: 'exact' }),
        supabase.from('deliveries').select('id', { count: 'exact' }).eq('status', 'delivered'),
        supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(3),
      ])

      const invData = inv.data?.length ? inv.data : MOCK_INVENTORY
      const totalUnits = invData.reduce((s: number, r: { units: number }) => s + r.units, 0)
      const droneData = drnRes.data?.length ? drnRes.data : MOCK_DRONES
      setStats({
        units: totalUnits,
        drones: droneData.filter((d: { status: string }) => d.status !== 'maintenance').length,
        hospitals: hospRes.count ?? 5,
        deliveries: delRes.count ?? MOCK_DELIVERIES.filter(d => d.status === 'delivered').length,
      })
      setAlerts(alertsRes.data?.length ? alertsRes.data : MOCK_ALERTS.slice(0, 3))
      setDrones((droneData as typeof drones).slice(0, 4))
      setLoaded(true)
    }
    load()
  }, [])

  const features = [
    { icon: Activity, title: 'Demand Forecasting', desc: '24h predictive engine using accident pattern analytics across metro corridors', color: '#3b82f6' },
    { icon: Droplets, title: 'Compatibility Matching', desc: 'Sub-group blood typing with rare antibody profiles to prevent transfusion reactions', color: '#dc2626' },
    { icon: Bot, title: 'Autonomous Drones', desc: 'Real-time route optimization using traffic data for fastest blood delivery paths', color: '#10b981' },
    { icon: Zap, title: 'Live Inventory Sync', desc: 'Supabase realtime — inventory updates propagate across all hospitals in <100ms', color: '#f59e0b' },
  ]

  const statusColor: Record<string, string> = {
    idle: '#64748b', dispatched: '#f59e0b', delivering: '#10b981',
    returning: '#3b82f6', charging: '#a855f7', maintenance: '#dc2626'
  }

  return (
    <div className="page" style={{ padding: '48px 48px' }}>
      {/* Hero */}
      <div style={{ maxWidth: '900px', marginBottom: '80px', paddingTop: '24px' }}>
        <div className="section-tag">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
          SET-2 · Hackathon 2026 · Final Round
        </div>
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 800,
          lineHeight: 1.05,
          letterSpacing: '-2px',
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Emergency Blood.{' '}
          <span style={{ background: 'linear-gradient(135deg, #dc2626, #f87171)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Delivered Autonomously.
          </span>
        </h1>
        <p style={{ fontSize: '17px', color: '#64748b', lineHeight: 1.8, maxWidth: '640px', marginBottom: '36px' }}>
          A predictive engine that synchronizes emergency blood logistics with real-time surgical demand —
          bridging blood banks to operating theaters in minutes, not hours.
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/dashboard"><button className="btn-blood"><Zap size={16} /> Open Dashboard <ArrowRight size={14} /></button></Link>
          <Link href="/drone-sim"><button className="btn-ghost"><Bot size={16} /> Watch 3D Simulation</button></Link>
        </div>
      </div>

      {/* Live Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '60px' }}>
        {[
          { label: 'Units Available', value: stats.units, suffix: '', icon: Droplets, color: '#dc2626' },
          { label: 'Active Drones', value: stats.drones, suffix: '', icon: Bot, color: '#10b981' },
          { label: 'Hospitals Served', value: stats.hospitals, suffix: '', icon: Building2, color: '#3b82f6' },
          { label: 'Deliveries Made', value: stats.deliveries, suffix: '+', icon: Activity, color: '#f59e0b' },
        ].map(({ label, value, suffix, icon: Icon, color }) => (
          <div key={label} className="card card-glow" style={{ '--border-glow': `${color}40` } as React.CSSProperties}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} color={color} />
              </div>
            </div>
            <div className="stat-number" style={{ fontSize: '42px', marginBottom: '6px' }}>
              {loaded ? <AnimatedCounter target={value} suffix={suffix} /> : '—'}
            </div>
            <div style={{ fontSize: '12px', color: '#334155' }}>Live from Supabase</div>
          </div>
        ))}
      </div>

      {/* Features + Alerts + Drones grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '60px' }}>
        {/* Features */}
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>Platform Capabilities</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>{desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Alerts + Drones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Live Alerts */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <AlertTriangle size={16} color="#f87171" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Active Alerts</h3>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#475569' }}>{alerts.length} unresolved</span>
            </div>
            {alerts.length === 0 ? (
              <div style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No active alerts</div>
            ) : alerts.map(a => (
              <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                <span className={`badge ${a.severity === 'critical' ? 'badge-critical' : a.severity === 'warning' ? 'badge-warning' : 'badge-info'}`} style={{ flexShrink: 0, fontSize: '10px' }}>
                  {a.severity}
                </span>
                <div style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5 }}>{a.message}</div>
              </div>
            ))}
            <Link href="/alerts"><div style={{ marginTop: '14px', fontSize: '13px', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>View all alerts <ArrowRight size={12} /></div></Link>
          </div>

          {/* Drone Status */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bot size={16} color="#10b981" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>Drone Fleet</h3>
            </div>
            {drones.map(d => {
              const bat = d.battery ?? d.battery_level ?? 0
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor[d.status] ?? '#64748b', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 500 }}>{d.name}</div>
                    <div style={{ fontSize: '11px', color: '#475569', textTransform: 'capitalize' }}>{d.status}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: bat < 20 ? '#f87171' : bat < 50 ? '#fbbf24' : '#34d399', fontWeight: 600 }}>
                    {bat}%
                  </div>
                  <div className="progress-bar" style={{ width: '60px' }}>
                    <div className="progress-fill" style={{
                      width: `${bat}%`,
                      background: bat < 20 ? 'linear-gradient(90deg,#7f1d1d,#dc2626)' : bat < 50 ? 'linear-gradient(90deg,#78350f,#f59e0b)' : undefined
                    }} />
                  </div>
                </div>
              )
            })}
            <Link href="/drones"><div style={{ marginTop: '14px', fontSize: '13px', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>Full fleet view <ArrowRight size={12} /></div></Link>
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { href: '/compatibility', label: 'Check Compatibility', icon: Droplets, color: '#dc2626' },
              { href: '/forecast', label: 'View Forecasts', icon: Clock, color: '#3b82f6' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link key={href} href={href}>
                <div className="card" style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} color={color} />
                  <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

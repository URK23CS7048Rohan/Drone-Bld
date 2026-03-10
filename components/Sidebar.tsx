'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Activity, Droplets, Building2, Bot, Map, GitBranch,
    FlaskConical, TrendingUp, AlertTriangle, Zap, Sparkles, ClipboardList
} from 'lucide-react'

const navItems = [
    { href: '/', label: 'Overview', icon: Activity },
    { href: '/dashboard', label: 'Dashboard', icon: Zap },
    { href: '/inventory', label: 'Blood Inventory', icon: Droplets },
    { href: '/hospitals', label: 'Hospitals', icon: Building2 },
    { href: '/drones', label: 'Drone Fleet', icon: Bot },
    { href: '/drone-sim', label: '3D Simulation', icon: Map, highlight: true, badge: '3D' },
    { href: '/ai-advisor', label: 'AI Advisor', icon: Sparkles, highlight: true, badge: 'AI' },
    { href: '/routes', label: 'Routes', icon: GitBranch },
    { href: '/compatibility', label: 'Compatibility', icon: FlaskConical },
    { href: '/receptionist', label: 'Receptionist', icon: ClipboardList, highlight: true, badge: 'NEW' },
    { href: '/forecast', label: 'Forecasting', icon: TrendingUp },
    { href: '/alerts', label: 'Alerts', icon: AlertTriangle },
]

export default function Sidebar() {
    const path = usePathname()

    return (
        <aside style={{
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            width: '240px',
            background: 'rgba(5,8,16,0.95)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(20px)',
            zIndex: 100,
        }}>
            {/* Logo */}
            <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'linear-gradient(135deg, #dc2626, #7f1d1d)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 16px rgba(220,38,38,0.5)',
                        flexShrink: 0,
                    }}>
                        <Droplets size={16} color="white" />
                    </div>
                    <div>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
                            Blood-Line
                        </div>
                        <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Navigator
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '8px' }}>
                    Emergency Hematology Logistics
                </div>
            </div>

            {/* Live status */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#34d399' }}>
                    <div className="pulse-dot" />
                    System Live — Realtime Active
                </div>
            </div>

            {/* Nav */}
            <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
                {navItems.map(({ href, label, icon: Icon, highlight, badge }) => {
                    const active = path === href || (href !== '/' && path.startsWith(href))
                    return (
                        <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                borderRadius: '10px',
                                marginBottom: '2px',
                                cursor: 'pointer',
                                background: active ? 'rgba(220,38,38,0.12)' : highlight ? 'rgba(220,38,38,0.05)' : 'transparent',
                                border: active ? '1px solid rgba(220,38,38,0.3)' : highlight ? '1px solid rgba(220,38,38,0.15)' : '1px solid transparent',
                                color: active ? '#f87171' : highlight ? '#fca5a5' : '#64748b',
                                fontSize: '13.5px',
                                fontWeight: active ? 600 : 500,
                                transition: 'all 0.15s ease',
                            }}
                                onMouseEnter={e => {
                                    if (!active) {
                                        const el = e.currentTarget as HTMLDivElement
                                        el.style.background = 'rgba(255,255,255,0.04)'
                                        el.style.color = '#94a3b8'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!active) {
                                        const el = e.currentTarget as HTMLDivElement
                                        el.style.background = highlight ? 'rgba(220,38,38,0.05)' : 'transparent'
                                        el.style.color = highlight ? '#fca5a5' : '#64748b'
                                    }
                                }}>
                                <Icon size={16} />
                                {label}
                                {badge && (
                                    <span style={{
                                        marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
                                        background: badge === 'AI' ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(99,102,241,0.25))' : 'rgba(220,38,38,0.2)',
                                        color: badge === 'AI' ? '#a78bfa' : '#f87171',
                                        padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em'
                                    }}>{badge}</span>
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '11px', color: '#334155' }}>
                SET-2 · Autonomous Hematology<br />
                Hackathon 2026 · Final Round
            </div>
        </aside>
    )
}

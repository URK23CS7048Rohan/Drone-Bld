'use client'
import dynamic from 'next/dynamic'

const DroneScene = dynamic(() => import('@/components/DroneScene'), {
    ssr: false, loading: () => (
        <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050810', color: '#475569', fontSize: '14px', flexDirection: 'column', gap: '16px' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid rgba(220,38,38,0.2)', borderTop: '3px solid #dc2626', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Loading 3D Scene…
        </div>
    )
})

export default function DroneSimPage() {
    return <DroneScene />
}

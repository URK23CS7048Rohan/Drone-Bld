'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_HOSPITALS, MOCK_PREDICTIONS } from '@/lib/mock-data'
import { Building2, MapPin, Phone, TrendingUp } from 'lucide-react'

type Hospital = {
    id: string; name: string; lat: number; lng: number; city: string;
    capacity: number; contact: string; created_at: string
}

const CITY_COLORS: Record<string, string> = {
    'Ramanathapuram': '#dc2626', 'Paramakudi': '#ef4444', 'Kamuthi': '#f97316',
    'Rameswaram': '#3b82f6', 'Mandapam': '#06b6d4', 'Mudukulathur': '#10b981',
    'Thiruvadanai': '#14b8a6', 'Madurai': '#a855f7', 'Chennai': '#f59e0b',
    'Coimbatore': '#8b5cf6', 'Tiruchirappalli': '#ec4899', 'Kochi': '#22c55e',
    'Bangalore': '#6366f1',
}

export default function HospitalsPage() {
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Hospital | null>(null)
    const [demandData, setDemandData] = useState<{ blood_type: string; predicted_units: number; confidence: number }[]>([])

    useEffect(() => {
        supabase.from('hospitals').select('*').order('name').then(({ data }) => {
            setHospitals(data?.length ? data : MOCK_HOSPITALS as Hospital[])
            setLoading(false)
        })
    }, [])

    const selectHospital = async (h: Hospital) => {
        setSelected(h)
        const { data } = await supabase.from('demand_predictions')
            .select('blood_type, predicted_units, confidence')
            .eq('hospital_id', h.id)
            .order('predicted_units', { ascending: false })
        if (data?.length) {
            setDemandData(data)
        } else {
            // Use mock predictions for this hospital
            const mockPred = MOCK_PREDICTIONS.filter(p => p.hospital_id === h.id)
            setDemandData(mockPred.length ? mockPred : [
                { blood_type: 'O+', predicted_units: Math.floor(h.capacity * 0.04), confidence: 0.85 },
                { blood_type: 'O-', predicted_units: Math.floor(h.capacity * 0.025), confidence: 0.82 },
                { blood_type: 'A+', predicted_units: Math.floor(h.capacity * 0.03), confidence: 0.88 },
                { blood_type: 'B+', predicted_units: Math.floor(h.capacity * 0.02), confidence: 0.80 },
            ])
        }
    }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
                <div className="section-tag"><Building2 size={12} /> Network</div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Hospital Network</h1>
                <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Click a hospital to view demand forecasts</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
                {/* Hospital cards grid */}
                <div>
                    {loading ? (
                        <div style={{ color: '#334155', textAlign: 'center', padding: '60px', fontSize: '14px' }}>Loading hospitals…</div>
                    ) : hospitals.length === 0 ? (
                        <div style={{ color: '#334155', textAlign: 'center', padding: '60px', fontSize: '14px' }}>No hospitals. Run the seed SQL in Supabase.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            {hospitals.map(h => {
                                const color = CITY_COLORS[h.city] ?? '#64748b'
                                const isSelected = selected?.id === h.id
                                return (
                                    <div key={h.id} className="card" onClick={() => selectHospital(h)}
                                        style={{ cursor: 'pointer', borderColor: isSelected ? `${color}60` : undefined, boxShadow: isSelected ? `0 0 24px ${color}20` : undefined }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Building2 size={20} color={color} />
                                            </div>
                                            <span className="badge badge-ok" style={{ fontSize: '10px' }}>Active</span>
                                        </div>
                                        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '6px' }}>{h.name}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#475569', fontSize: '12px', marginBottom: '4px' }}>
                                            <MapPin size={11} />{h.city}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', fontSize: '12px', marginBottom: '14px' }}>
                                            <Phone size={11} />{h.contact}
                                        </div>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${Math.min((h.capacity / 500) * 100, 100)}%`, background: `linear-gradient(90deg, ${color}80, ${color})` }} />
                                        </div>
                                        <div style={{ fontSize: '11px', color: '#334155', marginTop: '6px' }}>Capacity: {h.capacity} beds</div>
                                        {isSelected && (
                                            <div style={{ marginTop: '12px', padding: '8px 10px', background: `${color}12`, borderRadius: '8px', border: `1px solid ${color}30`, fontSize: '12px', color }}>
                                                ↓ Demand forecast loaded
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Demand panel */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <TrendingUp size={16} color="#a855f7" />
                            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                                {selected ? selected.name : 'Select a hospital'}
                            </h3>
                        </div>
                        {!selected ? (
                            <div style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                                Click any hospital card to view its blood demand forecast
                            </div>
                        ) : demandData.length === 0 ? (
                            <div style={{ color: '#334155', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>
                                No forecast data for this hospital
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                                    Next 24h demand forecast
                                </div>
                                {demandData.map(d => (
                                    <div key={d.blood_type}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span className="blood-chip">{d.blood_type}</span>
                                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>{d.predicted_units} units</span>
                                            </div>
                                            <span style={{ fontSize: '11px', color: '#a855f7' }}>{Math.round(d.confidence * 100)}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg,#7e22ce,#a855f7)', width: `${Math.min((d.predicted_units / 30) * 100, 100)}%`, transition: 'width 0.6s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

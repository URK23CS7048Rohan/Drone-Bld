'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_PREDICTIONS, MOCK_HOSPITALS } from '@/lib/mock-data'
import { TrendingUp, RefreshCw } from 'lucide-react'
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
    CartesianGrid, Legend, Area, AreaChart
} from 'recharts'

type Prediction = {
    id: string; hospital_id: string; blood_type: string
    predicted_units: number; actual_units: number | null
    prediction_date: string; confidence: number; mae: number | null
}
type Hospital = { id: string; name: string }

const BT_COLORS: Record<string, string> = {
    'O-': '#dc2626', 'O+': '#ef4444', 'A+': '#3b82f6', 'A-': '#60a5fa',
    'B+': '#10b981', 'B-': '#34d399', 'AB+': '#a855f7', 'AB-': '#c084fc'
}

export default function ForecastPage() {
    const [predictions, setPredictions] = useState<Prediction[]>([])
    const [hospitals, setHospitals] = useState<Hospital[]>([])
    const [selectedHospital, setSelectedHospital] = useState<string>('all')
    const [selectedBT, setSelectedBT] = useState<string>('all')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.from('hospitals').select('id, name').then(({ data }) =>
            setHospitals(data?.length ? data : MOCK_HOSPITALS.map(h => ({ id: h.id, name: h.name })))
        )
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    async function load() {
        setLoading(true)
        const { data } = await supabase.from('demand_predictions')
            .select('*')
            .order('prediction_date', { ascending: true })
        setPredictions(data?.length ? data : MOCK_PREDICTIONS as Prediction[])
        setLoading(false)
    }

    const filtered = predictions.filter(p =>
        (selectedHospital === 'all' || p.hospital_id === selectedHospital) &&
        (selectedBT === 'all' || p.blood_type === selectedBT)
    )

    // Chart data: group by date
    const byDate: Record<string, Record<string, number>> = {}
    for (const p of filtered) {
        if (!byDate[p.prediction_date]) byDate[p.prediction_date] = {}
        byDate[p.prediction_date][p.blood_type] = (byDate[p.prediction_date][p.blood_type] ?? 0) + p.predicted_units
        if (p.actual_units != null) byDate[p.prediction_date][`${p.blood_type}_actual`] = (byDate[p.prediction_date][`${p.blood_type}_actual`] ?? 0) + p.actual_units
    }
    const chartData = Object.entries(byDate).map(([date, vals]) => ({ date: new Date(date).toLocaleDateString(), ...vals }))

    const bloodTypes = [...new Set(filtered.map(p => p.blood_type))]

    // Metrics
    const withActual = filtered.filter(p => p.actual_units != null)
    const avgMAE = withActual.length > 0
        ? (withActual.reduce((s, p) => s + Math.abs((p.actual_units ?? 0) - p.predicted_units), 0) / withActual.length).toFixed(2)
        : 'N/A'
    const avgConf = filtered.length > 0
        ? (filtered.reduce((s, p) => s + p.confidence, 0) / filtered.length * 100).toFixed(1)
        : '0'

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; value: number; color: string }[]; label?: string }) => {
        if (!active || !payload?.length) return null
        return (
            <div style={{ background: '#0d111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{label}</div>
                {payload.map(p => (
                    <div key={p.dataKey} style={{ fontSize: '13px', color: p.color, marginBottom: '3px' }}>
                        {p.dataKey.replace('_actual', ' (actual)')}: {p.value}u
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
                <div className="section-tag"><TrendingUp size={12} /> Forecasting</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Demand Forecasting</h1>
                        <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Predicted vs actual blood demand by hospital and type</p>
                    </div>
                    <button className="btn-ghost" onClick={load}><RefreshCw size={14} /> Refresh</button>
                </div>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
                {[
                    { label: 'Mean Absolute Error', val: `${avgMAE} units`, desc: 'Lower is better', color: '#10b981' },
                    { label: 'Avg Confidence', val: `${avgConf}%`, desc: 'Prediction certainty', color: '#a855f7' },
                    { label: 'Total Predictions', val: filtered.length, desc: 'Records in range', color: '#3b82f6' },
                ].map(({ label, val, desc, color }) => (
                    <div key={label} className="card" style={{ padding: '18px' }}>
                        <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>{label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 800, color }}>{val}</div>
                        <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>{desc}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                <select className="input-field" style={{ width: '200px' }} value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}>
                    <option value="all">All Hospitals</option>
                    {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
                <select className="input-field" style={{ width: '140px' }} value={selectedBT} onChange={e => setSelectedBT(e.target.value)}>
                    <option value="all">All Blood Types</option>
                    {['O-', 'O+', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t}>{t}</option>)}
                </select>
            </div>

            {/* Chart */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>Predicted vs Actual Units</h3>
                {loading ? (
                    <div style={{ color: '#334155', textAlign: 'center', padding: '40px', fontSize: '13px' }}>Loading forecast data…</div>
                ) : chartData.length === 0 ? (
                    <div style={{ color: '#334155', textAlign: 'center', padding: '40px', fontSize: '13px' }}>No data for selected filters</div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                            <XAxis dataKey="date" stroke="#334155" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis stroke="#334155" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#64748b' }} />
                            {bloodTypes.map(bt => (
                                <Area key={bt} type="monotone" dataKey={bt} stroke={BT_COLORS[bt] ?? '#dc2626'}
                                    fill={`${BT_COLORS[bt] ?? '#dc2626'}15`} strokeWidth={2} dot={false} />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>
                    Prediction Records
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Blood Type</th>
                            <th>Predicted</th>
                            <th>Actual</th>
                            <th>Error</th>
                            <th>Confidence</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#334155' }}>No records found</td></tr>
                        ) : filtered.map(p => {
                            const err = p.actual_units != null ? Math.abs(p.actual_units - p.predicted_units) : null
                            return (
                                <tr key={p.id}>
                                    <td><span className="blood-chip">{p.blood_type}</span></td>
                                    <td style={{ fontWeight: 600, color: '#e2e8f0' }}>{p.predicted_units}</td>
                                    <td>{p.actual_units != null ? <span style={{ fontWeight: 600, color: '#34d399' }}>{p.actual_units}</span> : <span style={{ color: '#334155' }}>Pending</span>}</td>
                                    <td>{err != null ? <span style={{ color: err > 5 ? '#f87171' : '#fbbf24', fontWeight: 600 }}>{err}</span> : '—'}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div className="progress-bar" style={{ width: '60px' }}>
                                                <div style={{ height: '100%', borderRadius: '3px', background: 'linear-gradient(90deg,#7e22ce,#a855f7)', width: `${p.confidence * 100}%` }} />
                                            </div>
                                            <span style={{ fontSize: '12px', color: '#a855f7' }}>{Math.round(p.confidence * 100)}%</span>
                                        </div>
                                    </td>
                                    <td style={{ color: '#475569', fontSize: '12px' }}>{new Date(p.prediction_date).toLocaleDateString()}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

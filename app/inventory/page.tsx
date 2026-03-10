'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { MOCK_INVENTORY } from '@/lib/mock-data'
import { Droplets, Plus, Trash2, AlertTriangle, RefreshCw } from 'lucide-react'
import { BLOOD_TYPES } from '@/lib/blood-compat'

type Inventory = {
    id: string; blood_type: string; units: number; location_type: string;
    expiry_date: string; status: string; created_at: string
}

export default function InventoryPage() {
    const [items, setItems] = useState<Inventory[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ blood_type: 'O-', units: 10, location_type: 'bank', expiry_date: '', status: 'available' })

    const load = useCallback(async () => {
        setLoading(true)
        let q = supabase.from('blood_inventory').select('*').order('blood_type')
        if (filter) q = q.eq('blood_type', filter)
        const { data } = await q
        const result = data?.length ? data : (filter ? MOCK_INVENTORY.filter(i => i.blood_type === filter) : MOCK_INVENTORY)
        setItems(result as Inventory[])
        setLoading(false)
    }, [filter])

    useEffect(() => { load() }, [load])

    useEffect(() => {
        const ch = supabase.channel('inventory-page')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_inventory' }, load)
            .subscribe()
        return () => { supabase.removeChannel(ch) }
    }, [load])

    const daysUntilExpiry = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)

    const addItem = async () => {
        if (!form.expiry_date) return
        const { error } = await supabase.from('blood_inventory').insert({ ...form })
        if (!error) { setShowAdd(false); load() }
    }

    const deleteItem = async (id: string) => {
        await supabase.from('blood_inventory').delete().eq('id', id)
        load()
    }

    const byType: Record<string, number> = {}
    for (const i of items) { byType[i.blood_type] = (byType[i.blood_type] ?? 0) + i.units }

    return (
        <div className="page" style={{ padding: '40px' }}>
            <div style={{ marginBottom: '28px' }}>
                <div className="section-tag"><Droplets size={12} /> Inventory</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>Blood Inventory</h1>
                        <p style={{ color: '#475569', fontSize: '13px', marginTop: '4px' }}>Live units across all banks and hospitals</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-ghost" onClick={load}><RefreshCw size={14} /> Refresh</button>
                        <button className="btn-blood" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Units</button>
                    </div>
                </div>
            </div>

            {/* Summary chips */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
                <button onClick={() => setFilter('')} className={filter === '' ? 'btn-blood' : 'btn-ghost'} style={{ padding: '6px 14px', fontSize: '12px' }}>All Types</button>
                {BLOOD_TYPES.map(t => (
                    <button key={t} onClick={() => setFilter(t === filter ? '' : t)}
                        className={filter === t ? 'btn-blood' : 'btn-ghost'}
                        style={{ padding: '6px 14px', fontSize: '12px' }}>
                        {t} <span style={{ opacity: 0.7 }}>({byType[t] ?? 0})</span>
                    </button>
                ))}
            </div>

            {/* Add form modal */}
            {showAdd && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ width: '400px', background: '#0d111d' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>Add Blood Units</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Blood Type</label>
                                <select className="input-field" value={form.blood_type} onChange={e => setForm(f => ({ ...f, blood_type: e.target.value }))}>
                                    {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Units</label>
                                <input className="input-field" type="number" min={1} value={form.units}
                                    onChange={e => setForm(f => ({ ...f, units: parseInt(e.target.value) || 1 }))} />
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Location Type</label>
                                <select className="input-field" value={form.location_type} onChange={e => setForm(f => ({ ...f, location_type: e.target.value }))}>
                                    <option value="bank">Blood Bank</option>
                                    <option value="hospital">Hospital</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Expiry Date</label>
                                <input className="input-field" type="date" value={form.expiry_date}
                                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button className="btn-blood" onClick={addItem} style={{ flex: 1 }}>Add to Inventory</button>
                                <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#334155', fontSize: '14px' }}>Loading inventory…</div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Blood Type</th>
                                <th>Units</th>
                                <th>Location</th>
                                <th>Expiry</th>
                                <th>Days Left</th>
                                <th>Status</th>
                                <th>Added</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.length === 0 ? (
                                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#334155' }}>No inventory records. Add units or run the seed SQL.</td></tr>
                            ) : items.map(item => {
                                const days = daysUntilExpiry(item.expiry_date)
                                return (
                                    <tr key={item.id}>
                                        <td><span className="blood-chip">{item.blood_type}</span></td>
                                        <td style={{ fontWeight: 700, color: item.units < 15 ? '#f87171' : '#e2e8f0', fontSize: '16px' }}>{item.units}</td>
                                        <td><span className={`badge ${item.location_type === 'bank' ? 'badge-info' : 'badge-ok'}`}>{item.location_type === 'bank' ? 'Blood Bank' : 'Hospital'}</span></td>
                                        <td style={{ color: '#64748b', fontSize: '13px' }}>{new Date(item.expiry_date).toLocaleDateString()}</td>
                                        <td>
                                            {days < 7
                                                ? <span style={{ color: '#f87171', fontWeight: 600, fontSize: '13px' }}><AlertTriangle size={11} style={{ display: 'inline', marginRight: '4px' }} />{days}d</span>
                                                : <span style={{ color: days < 14 ? '#fbbf24' : '#34d399', fontWeight: 600, fontSize: '13px' }}>{days}d</span>}
                                        </td>
                                        <td><span className={`badge ${item.status === 'available' ? 'badge-ok' : item.status === 'reserved' ? 'badge-warning' : 'badge-critical'}`}>{item.status}</span></td>
                                        <td style={{ color: '#334155', fontSize: '12px' }}>{new Date(item.created_at).toLocaleDateString()}</td>
                                        <td>
                                            <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px' }}>
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
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

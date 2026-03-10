'use client'
import { useRef, useState, useMemo, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { Bot, Activity, Battery, Zap, MapPin, Play, RotateCcw, Route, TrendingDown, Droplets } from 'lucide-react'

/* ── Types ────────────────────────────────────────────────── */
type V3 = [number, number, number]

interface MissionDef {
    id: string
    droneName: string
    bloodType: string
    units: number
    from: { name: string; pos: V3 }
    to: { name: string; pos: V3 }
    color: string
    ledColor: string
    phase: 'idle' | 'takeoff' | 'transit' | 'approach' | 'landing' | 'dropoff' | 'return' | 'done'
    t: number
    altitude: number
    speed: number
    battery: number
    payload: boolean
    eta: number
    optimizedDist: number
    longestDist: number
    delay: number // stagger launch
}

/* ── Locations ───────────────────────────────────────────── */
const LOC = {
    BANK: { name: 'Ramanathapuram BB', pos: [-14, 0, -10] as V3 },
    GH_RAMA: { name: 'GH Ramanathapuram', pos: [14, 0, 10] as V3 },
    PARAMAK: { name: 'GH Paramakudi', pos: [18, 0, -14] as V3 },
    KAMUTHI: { name: 'Kamuthi GH', pos: [-8, 0, 16] as V3 },
    RAMESW: { name: 'Rameswaram GH', pos: [6, 0, -18] as V3 },
    MANDAP: { name: 'PHC Mandapam', pos: [-18, 0, 4] as V3 },
    MUDUKULATHUR: { name: 'Mudukulathur GH', pos: [20, 0, 0] as V3 },
}

/* ── Initial missions ────────────────────────────────────── */
const INITIAL_MISSIONS: MissionDef[] = [
    {
        id: 'm1', droneName: 'BL-D1 Lifewing', bloodType: 'O-', units: 4,
        from: LOC.BANK, to: LOC.GH_RAMA, color: '#dc2626', ledColor: '#f87171',
        phase: 'idle', t: 0, altitude: 0, speed: 0, battery: 94, payload: true, eta: 8,
        optimizedDist: 18.7, longestDist: 34.2, delay: 0,
    },
    {
        id: 'm2', droneName: 'BL-D2 Redline', bloodType: 'A+', units: 6,
        from: LOC.BANK, to: LOC.PARAMAK, color: '#3b82f6', ledColor: '#60a5fa',
        phase: 'idle', t: 0, altitude: 0, speed: 0, battery: 88, payload: true, eta: 12,
        optimizedDist: 24.5, longestDist: 42.1, delay: 1.5,
    },
    {
        id: 'm3', droneName: 'BL-D3 Hemex', bloodType: 'B+', units: 3,
        from: LOC.MANDAP, to: LOC.KAMUTHI, color: '#10b981', ledColor: '#34d399',
        phase: 'idle', t: 0, altitude: 0, speed: 0, battery: 91, payload: true, eta: 10,
        optimizedDist: 21.3, longestDist: 38.7, delay: 3.0,
    },
    {
        id: 'm4', droneName: 'BL-D4 Vanta', bloodType: 'AB-', units: 2,
        from: LOC.RAMESW, to: LOC.MUDUKULATHUR, color: '#a855f7', ledColor: '#c084fc',
        phase: 'idle', t: 0, altitude: 0, speed: 0, battery: 96, payload: true, eta: 14,
        optimizedDist: 28.6, longestDist: 48.3, delay: 5.0,
    },
]

/* ── Building helper ─────────────────────────────────────── */
function Box({ pos, size, color }: { pos: V3; size: V3; color: string }) {
    return (
        <mesh position={pos}>
            <boxGeometry args={size} />
            <meshPhongMaterial color={color} />
        </mesh>
    )
}

/* ── Windows on building face ────────────────────────────── */
function WindowGrid({ pos, w, h, depth, rows, cols }: {
    pos: V3; w: number; h: number; depth: number; rows: number; cols: number
}) {
    const wins = useMemo(() => {
        const out: { x: number; y: number; lit: boolean }[] = []
        for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++)
                out.push({
                    x: (c / (cols - 1) - 0.5) * (w * 0.7),
                    y: (r / (rows - 1) - 0.5) * (h * 0.7),
                    lit: Math.random() > 0.35,
                })
        return out
    }, [w, h, rows, cols])

    return (
        <group position={pos}>
            {wins.map((win, i) => (
                <mesh key={i} position={[win.x, win.y, depth]}>
                    <planeGeometry args={[w * 0.08, h * 0.08]} />
                    <meshBasicMaterial color={win.lit ? '#fde68a' : '#0f172a'} transparent opacity={win.lit ? 0.6 : 0.3} />
                </mesh>
            ))}
        </group>
    )
}

/* ── Location Building ───────────────────────────────────── */
function LocationBuilding({ name, pos, color, isBank }: { name: string; pos: V3; color: string; isBank?: boolean }) {
    const h = isBank ? 5 : 3 + Math.abs(pos[0] + pos[2]) * 0.12
    const w = isBank ? 4 : 2.5
    return (
        <group>
            <Box pos={[pos[0], h / 2 + pos[1], pos[2]]} size={[w, h, w]} color={isBank ? '#1e293b' : '#0f172a'} />
            {/* Beacon on top */}
            <mesh position={[pos[0], h + pos[1] + 0.3, pos[2]]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>
            <pointLight position={[pos[0], h + pos[1] + 0.5, pos[2]]} color={color} intensity={2} distance={8} />
            <WindowGrid pos={[pos[0], h / 2 + pos[1], pos[2] + w / 2 + 0.01]} w={w} h={h} depth={0} rows={3} cols={3} />
            {/* Cross or + symbol on front */}
            {!isBank && (
                <>
                    <mesh position={[pos[0], h + pos[1] - 0.5, pos[2] + w / 2 + 0.02]}>
                        <planeGeometry args={[0.6, 0.15]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                    <mesh position={[pos[0], h + pos[1] - 0.5, pos[2] + w / 2 + 0.02]}>
                        <planeGeometry args={[0.15, 0.6]} />
                        <meshBasicMaterial color="#dc2626" />
                    </mesh>
                </>
            )}
            {/* Label */}
            <Label text={name} pos={[pos[0], h + pos[1] + 1.5, pos[2]]} color={color} />
        </group>
    )
}

/* ── City fill buildings ─────────────────────────────────── */
function CityScape() {
    const buildings = useMemo(() => {
        const out: { x: number; z: number; h: number; w: number }[] = []
        for (let i = 0; i < 35; i++) {
            const x = (Math.random() - 0.5) * 50
            const z = (Math.random() - 0.5) * 50
            // Avoid overlapping with main locations
            const tooClose = Object.values(LOC).some(l => Math.abs(l.pos[0] - x) < 4 && Math.abs(l.pos[2] - z) < 4)
            if (!tooClose) out.push({ x, z, h: 1.5 + Math.random() * 4, w: 1 + Math.random() * 1.5 })
        }
        return out
    }, [])
    return (
        <group>
            {buildings.map((b, i) => (
                <Box key={i} pos={[b.x, b.h / 2, b.z]} size={[b.w, b.h, b.w]} color={i % 3 === 0 ? '#0f172a' : i % 3 === 1 ? '#1e293b' : '#111827'} />
            ))}
        </group>
    )
}

/* ── Rotor ────────────────────────────────────────────────── */
function Rotor({ offset, dir }: { offset: V3; dir: number }) {
    const ref = useRef<THREE.Mesh>(null)
    useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dir * dt * 45 })
    return (
        <mesh ref={ref} position={offset}>
            <cylinderGeometry args={[0.45, 0.45, 0.02, 6]} />
            <meshPhongMaterial color="#64748b" transparent opacity={0.35} />
        </mesh>
    )
}

/* ── Drone model ─────────────────────────────────────────── */
function DroneModel({ payload, ledColor }: { payload: boolean; ledColor: string }) {
    return (
        <group>
            {/* Body */}
            <mesh><boxGeometry args={[0.7, 0.18, 0.7]} /><meshPhongMaterial color="#334155" /></mesh>
            {/* Arms */}
            {[[-0.6, 0, -0.6], [0.6, 0, -0.6], [-0.6, 0, 0.6], [0.6, 0, 0.6]].map((p, i) => (
                <group key={i}>
                    <mesh position={p as V3}><cylinderGeometry args={[0.04, 0.04, 0.8]} /><meshPhongMaterial color="#475569" /></mesh>
                    <Rotor offset={p as V3} dir={i % 2 === 0 ? 1 : -1} />
                </group>
            ))}
            {/* LED */}
            <mesh position={[0, -0.15, 0.35]}><sphereGeometry args={[0.06, 6, 6]} /><meshBasicMaterial color={ledColor} /></mesh>
            <pointLight position={[0, -0.15, 0.35]} color={ledColor} intensity={1.5} distance={4} />
            {/* Payload */}
            {payload && (
                <mesh position={[0, -0.35, 0]}>
                    <boxGeometry args={[0.35, 0.22, 0.2]} />
                    <meshPhongMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
                </mesh>
            )}
        </group>
    )
}

/* ── Ground ───────────────────────────────────────────────── */
function Ground() {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[80, 80]} />
                <meshPhongMaterial color="#080c18" />
            </mesh>
            <gridHelper args={[80, 40, '#0d1b2a', '#0d1b2a']} position={[0, 0.01, 0]} />
        </group>
    )
}

/* ── Stars ────────────────────────────────────────────────── */
function SimpleStars() {
    const pts = useMemo(() => {
        const g = new THREE.BufferGeometry()
        const arr = new Float32Array(600)
        for (let i = 0; i < 600; i += 3) {
            arr[i] = (Math.random() - 0.5) * 160
            arr[i + 1] = 30 + Math.random() * 50
            arr[i + 2] = (Math.random() - 0.5) * 160
        }
        g.setAttribute('position', new THREE.BufferAttribute(arr, 3))
        return g
    }, [])
    return <points geometry={pts}><pointsMaterial size={0.2} color="#334155" /></points>
}

/* ── Flight curve between two points ─────────────────────── */
function useMissionCurve(from: V3, to: V3) {
    return useMemo(() => {
        const midX = (from[0] + to[0]) / 2
        const midZ = (from[2] + to[2]) / 2
        const dist = Math.sqrt((to[0] - from[0]) ** 2 + (to[2] - from[2]) ** 2)
        const h = 8 + dist * 0.15
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(from[0], 6.5, from[2]),
            new THREE.Vector3(from[0] + (midX - from[0]) * 0.3, h, from[2] + (midZ - from[2]) * 0.3),
            new THREE.Vector3(midX, h + 1, midZ),
            new THREE.Vector3(to[0] + (midX - to[0]) * 0.3, h, to[2] + (midZ - to[2]) * 0.3),
            new THREE.Vector3(to[0], 6.5, to[2]),
        ])
    }, [from, to])
}

/* ── Flight path line ─────────────────────────────────────── */
function FlightPath({ from, to, color, visible }: { from: V3; to: V3; color: string; visible: boolean }) {
    const curve = useMissionCurve(from, to)
    const pts = useMemo(() => curve.getPoints(80), [curve])
    const lineRef = useRef<THREE.Line>(null)

    const geom = useMemo(() => {
        const g = new THREE.BufferGeometry().setFromPoints(pts)
        return g
    }, [pts])

    if (!visible) return null

    return (
        <line ref={lineRef} geometry={geom}>
            <lineBasicMaterial color={color} transparent opacity={0.7} linewidth={2} />
        </line>
    )
}

/* ── Longest Path (zig-zag, red) ──────────────────────────── */
function LongestPath({ from, to, color, visible }: { from: V3; to: V3; color: string; visible: boolean }) {
    const curve = useMemo(() => {
        const dx = to[0] - from[0]
        const dz = to[2] - from[2]
        const h = 7
        return new THREE.CatmullRomCurve3([
            new THREE.Vector3(from[0], 6, from[2]),
            new THREE.Vector3(from[0] + dx * 0.15, h, from[2] - 6),
            new THREE.Vector3(from[0] + dx * 0.35, h + 2, from[2] + dz * 0.3 + 8),
            new THREE.Vector3(from[0] + dx * 0.5, h + 1, from[2] + dz * 0.5 - 5),
            new THREE.Vector3(from[0] + dx * 0.65, h + 3, from[2] + dz * 0.6 + 6),
            new THREE.Vector3(from[0] + dx * 0.8, h, from[2] + dz * 0.8 - 4),
            new THREE.Vector3(from[0] + dx * 0.9, h - 1, from[2] + dz * 0.95 + 3),
            new THREE.Vector3(to[0], 6, to[2]),
        ])
    }, [from, to])

    const pts = useMemo(() => curve.getPoints(100), [curve])
    const geom = useMemo(() => new THREE.BufferGeometry().setFromPoints(pts), [pts])

    if (!visible) return null
    return (
        <line geometry={geom}>
            <lineBasicMaterial color={color} transparent opacity={0.3} linewidth={1} />
        </line>
    )
}

/* ── Label billboard ──────────────────────────────────────── */
function Label({ text, pos, color }: { text: string; pos: V3; color: string }) {
    const ref = useRef<THREE.Sprite>(null)
    const tex = useMemo(() => {
        const c = document.createElement('canvas')
        c.width = 512; c.height = 64
        const ctx = c.getContext('2d')!
        ctx.fillStyle = 'rgba(0,0,0,0)'
        ctx.clearRect(0, 0, 512, 64)
        ctx.font = 'bold 30px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = color
        ctx.fillText(text, 256, 42)
        const t = new THREE.CanvasTexture(c)
        t.needsUpdate = true
        return t
    }, [text, color])

    return (
        <sprite ref={ref} position={pos} scale={[5, 0.7, 1]}>
            <spriteMaterial map={tex} transparent />
        </sprite>
    )
}

/* ── Mission Drone (flies on curve) ──────────────────────── */
function MissionDrone({ mission, onUpdate }: { mission: MissionDef; onUpdate: (p: Partial<MissionDef>) => void }) {
    const droneRef = useRef<THREE.Group>(null)
    const mRef = useRef(mission)
    mRef.current = mission
    const curve = useMissionCurve(mission.from.pos, mission.to.pos)

    useFrame((_, dt) => {
        const m = mRef.current
        if (!droneRef.current) return

        if (m.phase === 'idle' || m.phase === 'done') {
            const bp = m.phase === 'done' ? m.from.pos : m.from.pos
            droneRef.current.position.set(bp[0], 6.5, bp[2])
            return
        }

        if (m.phase === 'takeoff') {
            const nA = m.altitude + dt * 3
            droneRef.current.position.set(m.from.pos[0], 6.5 + nA, m.from.pos[2])
            onUpdate({ altitude: nA, speed: 20, battery: Math.max(m.battery - dt * 0.3, 0) })
            if (nA > 6) onUpdate({ phase: 'transit', t: 0, altitude: 6 })
            return
        }

        if (m.phase === 'transit') {
            const nT = Math.min(m.t + dt * 0.10, 1)
            const pt = curve.getPointAt(nT)
            droneRef.current.position.copy(pt)
            const tan = curve.getTangentAt(Math.min(nT, 0.99))
            droneRef.current.rotation.y = Math.atan2(tan.x, tan.z)
            onUpdate({
                t: nT,
                speed: 55 + Math.sin(nT * Math.PI) * 20,
                altitude: pt.y,
                battery: Math.max(m.battery - dt * 0.35, 0),
                eta: Math.ceil((1 - nT) / 0.10),
            })
            if (nT >= 0.97) onUpdate({ phase: 'approach', t: 0 })
            return
        }

        if (m.phase === 'approach') {
            const nT = Math.min(m.t + dt * 1.5, 1)
            const tp = m.to.pos
            droneRef.current.position.set(tp[0], 8 + tp[1], tp[2])
            onUpdate({ t: nT, speed: 12, altitude: 8, battery: Math.max(m.battery - dt * 0.15, 0) })
            if (nT >= 1) onUpdate({ phase: 'landing', t: 0 })
            return
        }

        if (m.phase === 'landing') {
            const nT = Math.min(m.t + dt * 1.2, 1)
            const h = THREE.MathUtils.lerp(8, 6.5, nT)
            const tp = m.to.pos
            droneRef.current.position.set(tp[0], h + tp[1], tp[2])
            onUpdate({ t: nT, speed: 3, altitude: h, battery: Math.max(m.battery - dt * 0.1, 0) })
            if (nT >= 1) onUpdate({ phase: 'dropoff', t: 0 })
            return
        }

        if (m.phase === 'dropoff') {
            const nT = Math.min(m.t + dt * 0.4, 1)
            onUpdate({ t: nT, speed: 0, payload: nT < 0.5 })
            if (nT >= 1) onUpdate({ phase: 'return', t: 0 })
            return
        }

        if (m.phase === 'return') {
            const home = new THREE.Vector3(m.from.pos[0], 6.5, m.from.pos[2])
            droneRef.current.position.lerp(home, dt * 0.5)
            onUpdate({ t: Math.min(m.t + dt * 0.06, 1), speed: 45, battery: Math.max(m.battery - dt * 0.2, 0) })
            if (droneRef.current.position.distanceTo(home) < 0.3) {
                droneRef.current.position.copy(home)
                onUpdate({ phase: 'done', speed: 0 })
            }
        }
    })

    const isFlying = mission.phase !== 'idle' && mission.phase !== 'done'

    return (
        <group>
            <group ref={droneRef} position={[mission.from.pos[0], 6.5, mission.from.pos[2]]}>
                <DroneModel payload={mission.payload} ledColor={mission.ledColor} />
            </group>
            <FlightPath from={mission.from.pos} to={mission.to.pos} color={mission.color} visible={isFlying || mission.phase === 'done'} />
            <LongestPath from={mission.from.pos} to={mission.to.pos} color={mission.color} visible={true} />
        </group>
    )
}

/* ── Main 3D scene ────────────────────────────────────────── */
function Scene({ missions, onUpdate }: { missions: MissionDef[]; onUpdate: (id: string, p: Partial<MissionDef>) => void }) {
    return (
        <>
            <color attach="background" args={['#060a14']} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[15, 25, 10]} intensity={1.5} color="#c8d6f0" />
            <directionalLight position={[-10, 15, -8]} intensity={0.6} color="#6366f1" />
            <hemisphereLight args={['#1e3a5f', '#0a0f1a', 0.9]} />

            <SimpleStars />
            <Ground />
            <CityScape />

            {/* All locations */}
            <LocationBuilding name="BLOOD BANK" pos={LOC.BANK.pos} color="#f87171" isBank />
            <LocationBuilding name="GH RAMANATHAPURAM" pos={LOC.GH_RAMA.pos} color="#60a5fa" />
            <LocationBuilding name="GH PARAMAKUDI" pos={LOC.PARAMAK.pos} color="#38bdf8" />
            <LocationBuilding name="KAMUTHI GH" pos={LOC.KAMUTHI.pos} color="#34d399" />
            <LocationBuilding name="RAMESWARAM GH" pos={LOC.RAMESW.pos} color="#c084fc" />
            <LocationBuilding name="PHC MANDAPAM" pos={LOC.MANDAP.pos} color="#fbbf24" />
            <LocationBuilding name="MUDUKULATHUR GH" pos={LOC.MUDUKULATHUR.pos} color="#f472b6" />

            {/* Mission drones */}
            {missions.map(m => (
                <MissionDrone key={m.id} mission={m} onUpdate={p => onUpdate(m.id, p)} />
            ))}
        </>
    )
}

/* ── HUD Phase Labels ─────────────────────────────────────── */
const PHASES: Record<string, string> = {
    idle: 'Standby', takeoff: 'Taking Off', transit: 'In Transit',
    approach: 'Approaching', landing: 'Landing', dropoff: 'Dropping Off',
    return: 'Returning', done: 'Mission Complete',
}

/* ── Exported component ───────────────────────────────────── */
export default function DroneScene() {
    const [missions, setMissions] = useState<MissionDef[]>(INITIAL_MISSIONS)
    const [selected, setSelected] = useState<string>('m1')
    const elapsed = useRef(0)
    const launched = useRef(false)

    const onUpdate = useCallback((id: string, p: Partial<MissionDef>) => {
        setMissions(prev => prev.map(m => m.id === id ? { ...m, ...p } : m))
    }, [])

    const launchAll = () => {
        if (launched.current) return
        launched.current = true
        elapsed.current = 0
        // Launch first drone immediately
        setMissions(prev => prev.map((m, i) =>
            i === 0 ? { ...m, phase: 'takeoff' as const, t: 0, altitude: 0, speed: 0, battery: m.battery, payload: true, eta: m.eta }
                : { ...m, phase: 'idle' as const, t: 0, altitude: 0, speed: 0, payload: true }
        ))
        // Stagger other launches
        INITIAL_MISSIONS.forEach((im, i) => {
            if (i === 0) return
            setTimeout(() => {
                setMissions(prev => prev.map(m =>
                    m.id === im.id && m.phase === 'idle'
                        ? { ...m, phase: 'takeoff' as const, t: 0, altitude: 0, speed: 0, battery: m.battery, payload: true, eta: m.eta }
                        : m
                ))
            }, im.delay * 1000)
        })
    }

    const resetAll = () => {
        launched.current = false
        setMissions(INITIAL_MISSIONS.map(m => ({ ...m })))
    }

    const selMission = missions.find(m => m.id === selected) ?? missions[0]
    const activeMissions = missions.filter(m => m.phase !== 'idle' && m.phase !== 'done').length
    const completedMissions = missions.filter(m => m.phase === 'done').length
    const totalSaved = missions.reduce((sum, m) => sum + (m.longestDist - m.optimizedDist), 0)
    const anyActive = missions.some(m => m.phase !== 'idle' && m.phase !== 'done')

    return (
        <div style={{ position: 'relative', width: '100%', height: '100vh', background: '#060a14', overflow: 'hidden' }}>
            <Canvas
                gl={{ antialias: true, powerPreference: 'default' }}
                dpr={[1, 1.5]}
                style={{ position: 'absolute', inset: 0 }}
                camera={{ position: [-30, 22, 35], fov: 50, near: 0.1, far: 250 }}
            >
                <OrbitControls enablePan={false} minPolarAngle={0.3} maxPolarAngle={Math.PI / 2.1} minDistance={10} maxDistance={80} target={[0, 4, 0]} />
                <Scene missions={missions} onUpdate={onUpdate} />
            </Canvas>

            {/* ── Title HUD ── */}
            <div style={{ position: 'absolute', top: 20, left: 20, background: 'rgba(6,10,20,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '14px 18px', zIndex: 10, minWidth: 260 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(220,38,38,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={15} color="#f87171" />
                    </div>
                    <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>Multi-Drone Operations</div>
                        <div style={{ fontSize: 11, color: '#475569' }}>Blood-Line Navigator · {missions.length} Drones</div>
                    </div>
                </div>

                {/* Operation Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                    <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{activeMissions}</div>
                        <div style={{ fontSize: 9, color: '#475569' }}>ACTIVE</div>
                    </div>
                    <div style={{ background: 'rgba(16,185,129,0.08)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399' }}>{completedMissions}</div>
                        <div style={{ fontSize: 9, color: '#475569' }}>DONE</div>
                    </div>
                    <div style={{ background: 'rgba(220,38,38,0.08)', borderRadius: 8, padding: '6px 8px', textAlign: 'center' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171' }}>{totalSaved.toFixed(0)}km</div>
                        <div style={{ fontSize: 9, color: '#475569' }}>SAVED</div>
                    </div>
                </div>

                {/* Mission List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {missions.map(m => {
                        const isSel = m.id === selected
                        const isAct = m.phase !== 'idle' && m.phase !== 'done'
                        return (
                            <button key={m.id} onClick={() => setSelected(m.id)} style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                                borderRadius: 8, border: `1px solid ${isSel ? m.color + '66' : 'rgba(255,255,255,0.05)'}`,
                                background: isSel ? m.color + '15' : 'rgba(255,255,255,0.02)',
                                cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', width: '100%',
                            }}>
                                <span style={{
                                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                                    background: isAct ? m.color : m.phase === 'done' ? '#10b981' : '#334155',
                                    boxShadow: isAct ? `0 0 6px ${m.color}` : 'none',
                                    animation: isAct ? 'pulse-dot 2s infinite' : 'none',
                                }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? m.ledColor : '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {m.droneName}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#475569' }}>{m.units}× {m.bloodType} → {m.to.name}</div>
                                </div>
                                <span style={{ fontSize: 9, color: isAct ? m.ledColor : '#334155', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                    {PHASES[m.phase]}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Telemetry HUD (selected drone) ── */}
            <div style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(6,10,20,0.92)', border: `1px solid ${selMission.color}33`, backdropFilter: 'blur(12px)', borderRadius: 14, padding: '16px 18px', minWidth: 220, zIndex: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: selMission.ledColor, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Droplets size={12} /> {selMission.droneName}
                </div>
                <div style={{ fontSize: 10, color: '#475569', marginBottom: 12 }}>
                    {selMission.units}× {selMission.bloodType} · {selMission.from.name} → {selMission.to.name}
                </div>
                {[
                    { I: Activity, l: 'Altitude', v: `${selMission.altitude.toFixed(1)}m` },
                    { I: Zap, l: 'Speed', v: `${selMission.speed.toFixed(0)} km/h` },
                    { I: MapPin, l: 'Phase', v: PHASES[selMission.phase] },
                    { I: Bot, l: 'Payload', v: selMission.payload ? `🩸 ${selMission.bloodType}` : 'Delivered' },
                ].map(({ I, l, v }) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}><I size={11} />{l}</div>
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize' }}>{v}</span>
                    </div>
                ))}
                {/* Battery */}
                <div style={{ marginTop: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}><Battery size={11} /> Battery</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: selMission.battery < 20 ? '#f87171' : selMission.battery < 50 ? '#fbbf24' : '#34d399' }}>
                            {selMission.battery.toFixed(0)}%
                        </span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${selMission.battery}%`, borderRadius: 3, background: selMission.battery < 20 ? '#f87171' : selMission.battery < 50 ? '#fbbf24' : '#34d399', transition: 'width 0.3s' }} />
                    </div>
                </div>
                {/* Route Comparison */}
                <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(16,185,129,0.06)', borderRadius: 8, border: '1px solid rgba(16,185,129,0.15)' }}>
                    <div style={{ fontSize: 9, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Route Optimization</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                            <div style={{ fontSize: 9, color: '#34d399' }}>Optimized</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>{selMission.optimizedDist}km</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: '#475569' }}>Saved</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24' }}>{((1 - selMission.optimizedDist / selMission.longestDist) * 100).toFixed(0)}%</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 9, color: '#f87171' }}>Longest</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#f87171' }}>{selMission.longestDist}km</div>
                        </div>
                    </div>
                </div>
                {/* ETA */}
                {selMission.phase === 'transit' && (
                    <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(16,185,129,0.08)', borderRadius: 6, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#34d399' }}>
                        ETA: ~{selMission.eta} min
                    </div>
                )}
            </div>

            {/* ── Bottom Control Bar ── */}
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(6,10,20,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '12px 20px', zIndex: 10 }}>
                {/* Mission summary */}
                <div style={{ display: 'flex', gap: 16, marginRight: 12 }}>
                    {missions.map(m => (
                        <div key={m.id} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: '#475569', marginBottom: 2 }}>{m.droneName.split(' ')[0]}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: m.color }}>{m.units}× {m.bloodType}</div>
                            <div style={{ fontSize: 9, color: '#334155' }}>→ {m.to.name.split(' ').pop()}</div>
                        </div>
                    ))}
                </div>

                <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.08)' }} />

                <button onClick={launchAll} disabled={anyActive} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                    borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: anyActive ? 'default' : 'pointer',
                    background: anyActive ? 'rgba(255,255,255,0.03)' : 'rgba(220,38,38,0.15)',
                    border: `1px solid ${anyActive ? 'rgba(255,255,255,0.06)' : 'rgba(220,38,38,0.4)'}`,
                    color: anyActive ? '#475569' : '#f87171', transition: 'all 0.2s',
                }}>
                    <Play size={14} /> Launch All ({missions.length})
                </button>

                <button onClick={resetAll} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                    borderRadius: 10, fontWeight: 600, fontSize: 12, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b',
                }}>
                    <RotateCcw size={12} /> Reset
                </button>

                {/* legend */}
                <div style={{ display: 'flex', gap: 10, marginLeft: 8 }}>
                    {missions.map(m => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#475569' }}>
                            <span style={{ width: 8, height: 3, borderRadius: 2, background: m.color, display: 'inline-block' }} />
                            {m.droneName.split(' ')[0]}
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            `}</style>
        </div>
    )
}

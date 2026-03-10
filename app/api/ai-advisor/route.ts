import { NextRequest, NextResponse } from 'next/server'

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY || ''
const FEATHERLESS_BASE_URL = 'https://api.featherless.ai/v1/chat/completions'
const MODEL = process.env.FEATHERLESS_MODEL || 'Qwen/Qwen2.5-7B-Instruct'

const SYSTEM_PROMPT = `You are "BloodLine AI", an expert AI assistant for the Blood-Line Navigator emergency hematology logistics platform, deployed in Ramanathapuram district, Tamil Nadu (South India).

You help hospital staff, blood bank operators, and drone dispatch coordinators with:
1. **Blood Demand Forecasting** — predict demand spikes based on season, festivals, trauma patterns
2. **Route Optimization** — suggest optimal drone delivery routes between blood banks and hospitals
3. **Inventory Management** — recommend stock levels per blood type, flag expiring units
4. **Emergency Triage** — advise on blood type compatibility, critical shortage protocols
5. **Logistics Planning** — suggest drone assignments, battery management, multi-stop routes

Current Network Coverage:
- GH Ramanathapuram (450 beds) — District HQ hospital
- Govt Hospital Paramakudi (300 beds)
- Kamuthi Government Hospital (180 beds)
- Rameswaram Govt Hospital (200 beds)
- PHC Mandapam (50 beds)
- Mudukulathur GH (150 beds)
- Thiruvadanai PHC (60 beds)
- Drone Fleet: BL-D1 "Lifewing", BL-D2 "Redline", BL-D3 "Hemex", BL-D4 "Vanta"

Current Inventory Snapshot:
O-: 32 units (bank) + 11 units (hospital, reserved)
O+: 78 units (bank) + 25 units (hospital)
A+: 41 units (hospital) + 18 units (bank)
A-: 9 units (critically low!)
B+: 53 units (hospital) + 22 units (bank)
B-: 6 units (reserved, expiring in 2 days!)
AB+: 14 units (hospital)
AB-: 3 units (critically low!)

Be concise, precise, and actionable. Use bullet points. Always consider the rural South Indian context — limited road access, monsoon weather, and festival seasons affect logistics. Respond in English.`

export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json()

        if (!FEATHERLESS_API_KEY) {
            // Return a helpful fallback when API key isn't set
            return NextResponse.json({
                response: `⚠️ **Featherless AI API key not configured.**\n\nTo enable AI-powered analysis, add your API key to \`.env.local\`:\n\n\`\`\`\nFEATHERLESS_API_KEY=your_key_here\nFEATHERLESS_MODEL=Qwen/Qwen2.5-7B-Instruct\n\`\`\`\n\nGet your free API key at [featherless.ai](https://featherless.ai)\n\n**Demo Response:**\nBased on current inventory, I recommend:\n- 🚨 **Urgent**: A- critically low (9 units) — initiate donor drive at GH Ramanathapuram\n- ⚠️ B- batch expiring in 2 days — redirect to nearest hospital with active trauma cases\n- 📊 O+ stock healthy (103 units) — no action needed\n- 🚁 Route optimization: Dispatch BL-D1 from Ramanathapuram BB to Paramakudi GH (42.5km, ETA 18min)`,
                model: 'demo-mode',
                usage: { prompt_tokens: 0, completion_tokens: 0 }
            })
        }

        const apiMessages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages
        ]

        const response = await fetch(FEATHERLESS_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${FEATHERLESS_API_KEY}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: apiMessages,
                max_tokens: 1024,
                temperature: 0.7,
                stream: false,
            }),
        })

        if (!response.ok) {
            const err = await response.text()
            console.error('Featherless AI error:', err)
            return NextResponse.json(
                { error: 'Failed to get AI response', details: err },
                { status: response.status }
            )
        }

        const data = await response.json()
        const aiMessage = data.choices?.[0]?.message?.content ?? 'No response generated.'

        return NextResponse.json({
            response: aiMessage,
            model: data.model ?? MODEL,
            usage: data.usage ?? { prompt_tokens: 0, completion_tokens: 0 }
        })
    } catch (error) {
        console.error('AI Advisor API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

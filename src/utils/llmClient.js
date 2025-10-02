// 極簡 OpenAI 相容 LLM 用戶端（前端直接呼叫：僅建議開發用；正式建議加 Proxy
const getEnv = () => ({
  baseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
})

export async function generateMealSuggestions({ remaining, candidates, userLimits }) {
  const { baseUrl, apiKey, model } = getEnv()
  if (!apiKey) throw new Error('未設定 VITE_OPENAI_API_KEY')

  // 收斂候選內容避免超長 Token
  const compact = candidates.slice(0, 10).map((m) => ({
    id: m.id || undefined,
    name: m.name || '未命名',
    type: m.type || 'snack',
    protein: Number(m.protein || 0),
    fat: Number(m.fat || 0),
    carb: Number(m.carb || 0),
    kcal: Number(m.kcal || 0),
  }))

  const system = '你是營養規劃助手，僅回傳 JSON（不含多餘文字）。單位使用公制，中文繁體。'
  const user = {
    task: '請根據缺口與候選餐點，產出 3 套建議（每套 1-2 項），允許 0.5x 或 1x 份量微調。',
    remaining,
    limits: userLimits || { budget: 'normal', time: 'any', avoid: [] },
    candidates: compact,
    format: {
      suggestions: [
        {
          title: 'string',
          items: [ { name: 'string', portion: 0.5, macros: { protein: 0, fat: 0, carb: 0, kcal: 0 } } ],
          totalMacros: { protein: 0, fat: 0, carb: 0, kcal: 0 },
          rationale: 'string'
        }
      ]
    }
  }

  const body = {
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(user) },
    ],
    temperature: 0.5,
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`LLM 請求失敗：${res.status} ${t}`)
  }

  const json = await res.json()
  const content = json?.choices?.[0]?.message?.content
  if (!content) throw new Error('LLM 回應為空')
  let parsed
  try { parsed = JSON.parse(content) } catch { throw new Error('LLM 回應非 JSON') }
  if (!parsed?.suggestions || !Array.isArray(parsed.suggestions)) throw new Error('JSON 結構不符預期')
  return parsed
}



import { useMemo } from 'react'
import { useDietStore } from '../stores/useDietStore'

function computeTotals(meals) {
  return meals.reduce((acc, m) => ({
    protein: acc.protein + Number(m.protein || 0),
    fat: acc.fat + Number(m.fat || 0),
    carb: acc.carb + Number(m.carb || 0),
    kcal: acc.kcal + Number(m.kcal || 0),
  }), { protein: 0, fat: 0, carb: 0, kcal: 0 })
}

function distance(a, b) {
  // 簡單 L1 距離（以 g 為基礎），兼顧 kcal 權重
  const d = Math.abs((a.protein||0) - (b.protein||0))
          + Math.abs((a.fat||0) - (b.fat||0))
          + Math.abs((a.carb||0) - (b.carb||0))
          + Math.abs((a.kcal||0) - (b.kcal||0)) / 10
  return d
}

export default function AISuggestions() {
  const todayKey = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }, [])
  const mealsByDate = useDietStore(s => s.mealsByDate)
  const goals = useDietStore(s => s.goals)
  const mealLibrary = useDietStore(s => s.mealLibrary)
  
  const meals = useMemo(() => mealsByDate[todayKey] || [], [mealsByDate, todayKey])

  const totals = useMemo(() => computeTotals(meals), [meals])
  const remaining = useMemo(() => ({
    protein: Math.max(0, (goals.protein || 0) - totals.protein),
    fat: Math.max(0, (goals.fat || 0) - totals.fat),
    carb: Math.max(0, (goals.carb || 0) - totals.carb),
    kcal: Math.max(0, (goals.kcal || 0) - totals.kcal),
  }), [goals, totals])

  const suggestions = useMemo(() => {
    if (!mealLibrary || mealLibrary.length === 0) return []
    // 依與剩餘距離排序，取前 5
    const scored = mealLibrary.map(item => ({ item, score: distance(item, remaining) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
    return scored.map(s => s.item)
  }, [mealLibrary, remaining.protein, remaining.fat, remaining.carb, remaining.kcal])

  // 建議策略（啟發式）：
  // - 若蛋白質缺口大，提示高蛋白選項；若碳水超過熱量限制，建議降低碳水
  const tips = useMemo(() => {
    const tipsList = []
    if ((goals.protein || 0) > 0 && remaining.protein > (goals.protein * 0.25)) {
      tipsList.push('蛋白質缺口較大，建議選擇高蛋白低脂食物（如雞胸、豆腐、優格）。')
    }
    if ((goals.kcal || 0) > 0 && remaining.kcal < (goals.kcal * 0.15)) {
      tipsList.push('今日熱量所剩不多，建議以低熱量選項為主，避免高油脂。')
    }
    if ((goals.carb || 0) > 0 && remaining.carb < (goals.carb * 0.15) && remaining.protein > 0) {
      tipsList.push('碳水接近上限，優先補足蛋白質，並控制碳水份量。')
    }
    if (tipsList.length === 0) tipsList.push('整體分配平衡，選擇均衡的一餐即可。')
    return tipsList
  }, [remaining.protein, remaining.fat, remaining.carb, remaining.kcal, goals.protein, goals.fat, goals.carb, goals.kcal])

  const hasGoals = (goals.protein || goals.fat || goals.carb || goals.kcal)

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">AI 建議（啟發式）</h2>
      {!hasGoals && (
        <p className="text-sm text-gray-600 dark:text-gray-300">尚未設定目標，請先於「目標設定」中設定每日目標。</p>
      )}

      {hasGoals && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded bg-blue-50 dark:bg-blue-900/20">
              <div className="text-xs text-blue-700 dark:text-blue-300">蛋白質剩餘</div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">{Math.round(remaining.protein)} g</div>
            </div>
            <div className="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20">
              <div className="text-xs text-yellow-700 dark:text-yellow-300">脂肪剩餘</div>
              <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">{Math.round(remaining.fat)} g</div>
            </div>
            <div className="p-3 rounded bg-green-50 dark:bg-green-900/20">
              <div className="text-xs text-green-700 dark:text-green-300">碳水剩餘</div>
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">{Math.round(remaining.carb)} g</div>
            </div>
            <div className="p-3 rounded bg-red-50 dark:bg-red-900/20">
              <div className="text-xs text-red-700 dark:text-red-300">熱量剩餘</div>
              <div className="text-lg font-semibold text-red-700 dark:text-red-300">{Math.round(remaining.kcal)} kcal</div>
            </div>
          </div>

          <ul className="list-disc pl-5 text-sm space-y-1 text-gray-700 dark:text-gray-300">
            {tips.map((t, i) => (<li key={i}>{t}</li>))}
          </ul>

          <div>
            <h3 className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-100">餐點庫推薦</h3>
            {suggestions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">目前餐點庫無資料，請先至餐點庫新增常用餐點。</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map((m) => (
                  <div key={m.id} className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div className="font-medium text-gray-900 dark:text-gray-100">{m.name || '未命名'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">P {m.protein}g · F {m.fat}g · C {m.carb}g · {m.kcal} kcal</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}



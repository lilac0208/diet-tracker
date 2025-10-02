import { useMemo } from 'react'
import { useDietStore } from '../stores/useDietStore'
import { motion } from 'framer-motion'

const ProgressBar = ({ label, value, goal, unit, color = 'blue' }) => {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0
  const remaining = goal ? Math.max(0, goal - value) : 0
  
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <div className="text-right">
          <div className="text-gray-900 dark:text-gray-100">{value}/{goal || 0} {unit}</div>
          {remaining > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">剩餘 {remaining} {unit}</div>
          )}
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <motion.div 
          className={`${colorClasses[color]} h-3`}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {pct}% 完成
      </div>
    </div>
  )
}

export default function TodayProgress() {
  const today = useMemo(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dd}`
  }, [])
  const mealsRaw = useDietStore((s) => s.mealsByDate[today])
  const goals = useDietStore((s) => s.goals)
  const meals = mealsRaw ?? []

  const totals = useMemo(() => {
    return meals.reduce((acc, m) => ({
      protein: acc.protein + Number(m.protein || 0),
      fat: acc.fat + Number(m.fat || 0),
      carb: acc.carb + Number(m.carb || 0),
      kcal: acc.kcal + Number(m.kcal || 0),
    }), { protein: 0, fat: 0, carb: 0, kcal: 0 })
  }, [meals])

  const groupedByType = useMemo(() => {
    const sumByType = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    const countByType = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
    meals.forEach(m => {
      const t = m.type || 'snack'
      sumByType[t] = (sumByType[t] || 0) + Number(m.kcal || 0)
      countByType[t] = (countByType[t] || 0) + 1
    })
    return { sumByType, countByType }
  }, [meals])

  const todayDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">今日進度</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300">{todayDate}</p>
      </div>

      <div className="space-y-4">
        <ProgressBar 
          label="蛋白質" 
          value={Math.round(totals.protein)} 
          goal={goals.protein} 
          unit="g" 
          color="blue"
        />
        <ProgressBar 
          label="脂肪" 
          value={Math.round(totals.fat)} 
          goal={goals.fat} 
          unit="g" 
          color="yellow"
        />
        <ProgressBar 
          label="碳水" 
          value={Math.round(totals.carb)} 
          goal={goals.carb} 
          unit="g" 
          color="green"
        />
        <ProgressBar 
          label="熱量" 
          value={Math.round(totals.kcal)} 
          goal={goals.kcal} 
          unit="kcal" 
          color="red"
        />
      </div>

      {meals.length > 0 && (
        <div className="border-t dark:border-gray-700 pt-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">今日餐點</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {[
              { key: 'breakfast', label: '早餐' },
              { key: 'lunch', label: '午餐' },
              { key: 'dinner', label: '晚餐' },
              { key: 'snack', label: '加餐' },
            ].filter(({ key }) => (groupedByType.countByType[key] || 0) > 0)
              .map(({ key, label }) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">
                  {label}
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">({groupedByType.countByType[key]} 筆)</span>
                </span>
                <span className="text-gray-900 dark:text-gray-100">{Math.round(groupedByType.sumByType[key])} kcal</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
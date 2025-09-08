import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useDietStore } from '../stores/useDietStore'

const clamp = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0))

const PRESET_GOALS = {
  maintenance: { name: '維持體重', pPct: 25, fPct: 20, cPct: 55 },
  weightLoss: { name: '減重', pPct: 30, fPct: 25, cPct: 45 },
  muscleGain: { name: '增肌', pPct: 35, fPct: 20, cPct: 45 },
  lowCarb: { name: '低碳', pPct: 30, fPct: 35, cPct: 35 }
}

export default function GoalSetter() {
  const profile = useDietStore(s => s.profile)
  const goals = useDietStore(s => s.goals)
  const setGoals = useDietStore(s => s.setGoals)
  const [selectedPreset, setSelectedPreset] = useState('')
  const [showShortTerm, setShowShortTerm] = useState(false)

  const tdee = profile?.tdee || 2000

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      kcal: goals.kcal || tdee,
      pPct: 25,
      fPct: 20,
      cPct: 55,
      protein: goals.protein || 0,
      fat: goals.fat || 0,
      carb: goals.carb || 0,
      targetWeight: profile?.weight || 0,
      targetWeeks: 4,
      goalType: 'maintenance'
    }
  })

  useEffect(() => {
    if (goals.kcal) {
      setValue('kcal', goals.kcal)
      setValue('protein', goals.protein)
      setValue('fat', goals.fat)
      setValue('carb', goals.carb)
    }
  }, [goals, setValue])

  const values = watch()
  const { kcal, pPct, fPct, cPct, targetWeight, targetWeeks, goalType } = values

  const shortTermKcal = useMemo(() => {
    if (!showShortTerm || !targetWeight || !targetWeeks) return kcal
    
    const currentWeight = profile?.weight || 0
    const weightDiff = targetWeight - currentWeight
    const weeklyDeficit = weightDiff / targetWeeks * 7700
    
    if (goalType === 'weightLoss') {
      return Math.max(1200, tdee - weeklyDeficit / 7)
    } else if (goalType === 'muscleGain') {
      return tdee + 300
    }
    return tdee
  }, [showShortTerm, targetWeight, targetWeeks, goalType, kcal, tdee, profile])

  const computed = useMemo(() => {
    const sumPct = clamp(pPct, 0, 100) + clamp(fPct, 0, 100) + clamp(cPct, 0, 100)
    const norm = sumPct > 0 ? sumPct : 1
    const targetKcal = showShortTerm ? shortTermKcal : kcal
    const pKcal = (targetKcal * clamp(pPct, 0, 100)) / norm
    const fKcal = (targetKcal * clamp(fPct, 0, 100)) / norm
    const cKcal = (targetKcal * clamp(cPct, 0, 100)) / norm
    const protein = Math.round(pKcal / 4)
    const fat = Math.round(fKcal / 9)
    const carb = Math.round(cKcal / 4)
    return { protein, fat, carb, kcal: targetKcal }
  }, [kcal, pPct, fPct, cPct, showShortTerm, shortTermKcal])

  useEffect(() => {
    setValue('protein', computed.protein)
    setValue('fat', computed.fat)
    setValue('carb', computed.carb)
    setValue('kcal', computed.kcal)
  }, [computed, setValue])

  const applyPreset = (presetKey) => {
    const preset = PRESET_GOALS[presetKey]
    if (preset) {
      setValue('pPct', preset.pPct)
      setValue('fPct', preset.fPct)
      setValue('cPct', preset.cPct)
      setSelectedPreset(presetKey)
    }
  }

  const onSubmit = (data) => {
    setGoals({
      protein: Number(data.protein),
      fat: Number(data.fat),
      carb: Number(data.carb),
      kcal: Number(data.kcal),
    })
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">目標設定</h2>

      {/* 預設目標 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">快速設定</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PRESET_GOALS).map(([key, preset]) => (
            <button
              key={key}
              type="button"
              onClick={() => applyPreset(key)}
              className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                selectedPreset === key
                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* 短期目標切換 */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="shortTerm"
          checked={showShortTerm}
          onChange={(e) => setShowShortTerm(e.target.checked)}
          className="rounded border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
        />
        <label htmlFor="shortTerm" className="text-sm text-gray-700 dark:text-gray-300">
          設定短期目標
        </label>
      </div>

      {showShortTerm && (
        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-sm text-gray-700 dark:text-gray-300">目標體重 (kg)</span>
              <input
                type="number"
                step="0.1"
                {...register('targetWeight', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
              />
            </label>
            <label>
              <span className="text-sm text-gray-700 dark:text-gray-300">週數</span>
              <input
                type="number"
                min="1"
                max="12"
                {...register('targetWeeks', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
              />
            </label>
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300">目標類型</label>
            <select
              {...register('goalType')}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            >
              <option value="maintenance">維持體重</option>
              <option value="weightLoss">減重</option>
              <option value="muscleGain">增肌</option>
            </select>
          </div>
          {shortTermKcal !== kcal && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              建議熱量: {Math.round(shortTermKcal)} kcal
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-700 dark:text-gray-300">每日熱量目標 (kcal)</label>
          <input
            type="number"
            {...register('kcal', { valueAsNumber: true })}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            建議參考你的 TDEE：{tdee} kcal
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">蛋白 %</span>
            <input
              type="number"
              {...register('pPct', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            />
          </label>
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">脂肪 %</span>
            <input
              type="number"
              {...register('fPct', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            />
          </label>
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">碳水 %</span>
            <input
              type="number"
              {...register('cPct', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">蛋白質 (g)</span>
            <input
              type="number"
              {...register('protein', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            />
          </label>
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">脂肪 (g)</span>
            <input
              type="number"
              {...register('fat', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            />
          </label>
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">碳水 (g)</span>
            <input
              type="number"
              {...register('carb', { valueAsNumber: true })}
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          設定目標
        </button>
      </form>
    </div>
  )
}
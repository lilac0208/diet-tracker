import { useRef, useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useDietStore } from '../stores/useDietStore'
import { macrosToKcal } from '../utils/nutrition'

export default function MealLibrary() {
  const mealLibrary = useDietStore(s => s.mealLibrary)
  const addPreset = useDietStore(s => s.addPreset)
  const removePreset = useDietStore(s => s.removePreset)
  const setMealLibrary = useDietStore(s => s.setMealLibrary)
  const clearMealLibrary = useDietStore(s => s.clearMealLibrary)
  const addMeal = useDietStore(s => s.addMeal)

  const { register, handleSubmit, reset } = useForm()
  const fileRef = useRef(null)
  const [q, setQ] = useState('')

  const onAddPreset = (data) => {
    const kcal = macrosToKcal(data)
    addPreset({
      name: data.name?.trim() || '未命名',
      protein: Number(data.protein || 0),
      fat: Number(data.fat || 0),
      carb: Number(data.carb || 0),
      kcal
    })
    reset({ name: '', protein: '', fat: '', carb: '' })
  }

  const applyPreset = (p, type = 'lunch') => {
    addMeal({ type, protein: p.protein, fat: p.fat, carb: p.carb, kcal: p.kcal })
  }

  const filtered = useMemo(() => {
    const keyword = q.trim().toLowerCase()
    if (!keyword) return mealLibrary
    return mealLibrary.filter(p => p.name.toLowerCase().includes(keyword))
  }, [q, mealLibrary])

  const exportJSON = () => {
    const data = mealLibrary.map(({ id, ...rest }) => rest) // 匯出時不帶 id
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'meal-library.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = async (file) => {
    if (!file) return
    const text = await file.text()
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('格式錯誤：需要陣列')
      const sanitized = parsed.map((p) => ({
        id: crypto.randomUUID(),
        name: String(p.name || '未命名'),
        protein: Number(p.protein || 0),
        fat: Number(p.fat || 0),
        carb: Number(p.carb || 0),
        kcal: Number(p.kcal || macrosToKcal(p)),
      }))
      setMealLibrary(sanitized)
    } catch (e) {
      alert('匯入失敗：' + e.message)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">我的餐點庫</h2>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋名稱…"
            className="h-9 rounded-md border border-gray-300 dark:border-gray-600 px-3 text-sm dark:bg-gray-700 dark:text-gray-100"
          />
          <button 
            onClick={exportJSON} 
            className="h-9 px-3 rounded-md bg-slate-700 dark:bg-slate-600 text-white text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          >
            匯出
          </button>
          <button 
            onClick={() => fileRef.current?.click()} 
            className="h-9 px-3 rounded-md bg-slate-500 dark:bg-slate-600 text-white text-sm hover:bg-slate-600 dark:hover:bg-slate-700 transition-colors"
          >
            匯入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => importJSON(e.target.files?.[0])}
          />
          <button 
            onClick={clearMealLibrary} 
            className="h-9 px-3 rounded-md bg-red-600 dark:bg-red-700 text-white text-sm hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
          >
            清空
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onAddPreset)} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <label className="col-span-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">名稱</span>
          <input 
            {...register('name', { required: true })} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" 
            placeholder="雞胸便當" 
          />
        </label>
        <label>
          <span className="text-sm text-gray-700 dark:text-gray-300">蛋白質(g)</span>
          <input 
            type="number" 
            step="0.1" 
            {...register('protein')} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" 
          />
        </label>
        <label>
          <span className="text-sm text-gray-700 dark:text-gray-300">脂肪(g)</span>
          <input 
            type="number" 
            step="0.1" 
            {...register('fat')} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" 
          />
        </label>
        <label className="col-span-2">
          <span className="text-sm text-gray-700 dark:text-gray-300">碳水(g)</span>
          <input 
            type="number" 
            step="0.1" 
            {...register('carb')} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" 
          />
        </label>
        <button 
          type="submit" 
          className="col-span-2 w-full bg-indigo-600 dark:bg-indigo-700 text-white py-2 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
        >
          新增到餐點庫
        </button>
      </form>

      <div className="divide-y dark:divide-gray-700">
        {filtered.length === 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
            沒有符合的餐點。
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="py-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-gray-100">{p.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                P{p.protein} F{p.fat} C{p.carb} | {p.kcal} kcal
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => applyPreset(p, 'breakfast')} 
                className="px-2 py-1 text-xs bg-emerald-600 dark:bg-emerald-700 text-white rounded hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
              >
                早餐
              </button>
              <button 
                onClick={() => applyPreset(p, 'lunch')} 
                className="px-2 py-1 text-xs bg-emerald-600 dark:bg-emerald-700 text-white rounded hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
              >
                午餐
              </button>
              <button 
                onClick={() => applyPreset(p, 'dinner')} 
                className="px-2 py-1 text-xs bg-emerald-600 dark:bg-emerald-700 text-white rounded hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
              >
                晚餐
              </button>
              <button 
                onClick={() => applyPreset(p, 'snack')} 
                className="px-2 py-1 text-xs bg-emerald-600 dark:bg-emerald-700 text-white rounded hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors"
              >
                加餐
              </button>
              <button 
                onClick={() => removePreset(p.id)} 
                className="px-2 py-1 text-xs bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 transition-colors"
              >
                刪除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
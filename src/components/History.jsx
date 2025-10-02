import { useState, useMemo, useRef } from 'react'
import { useDietStore } from '../stores/useDietStore'
import { useForm } from 'react-hook-form'
import { macrosToKcal } from '../utils/nutrition'

export default function History() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const [selectedDate, setSelectedDate] = useState(`${yyyy}-${mm}-${dd}`)
  const [viewMode, setViewMode] = useState('daily')
  
  const mealsByDate = useDietStore(s => s.mealsByDate)
  const goals = useDietStore(s => s.goals)
  const removeMeal = useDietStore(s => s.removeMeal)
  const reorderMeals = useDietStore(s => s.reorderMeals)
  const addMealForDate = useDietStore(s => s.addMealForDate)

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { type: 'breakfast', name: '', protein: '', fat: '', carb: '' }
  })
  const photoDataRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) { photoDataRef.current = null; setPreview(null); return }
    const reader = new FileReader()
    reader.onload = () => { photoDataRef.current = reader.result; setPreview(reader.result) }
    reader.readAsDataURL(file)
  }

  const onQuickAdd = (data) => {
    // 驗證與安全轉型
    const p = Number(data.protein)
    const f = Number(data.fat)
    const c = Number(data.carb)
    const numsOk = [p, f, c].every((v) => Number.isFinite(v) && v >= 0)
    if (!numsOk) {
      alert('請輸入有效的數值（>= 0）')
      return
    }
    const kcal = macrosToKcal({ protein: p, fat: f, carb: c })
    const name = (data.name || '').trim()
    const payload = { type: data.type, name, protein: p, fat: f, carb: c, kcal, photo: photoDataRef.current || null }
    addMealForDate(selectedDate, payload)
    reset({ type: data.type, name: '', protein: '', fat: '', carb: '' })
    photoDataRef.current = null
    setPreview(null)
  }

  // 取得選定日期的餐點：直接訂閱 store 的指定 key，並在組件端處理預設值
  const selectedMealsRaw = useDietStore(s => s.mealsByDate[selectedDate])
  const selectedMeals = selectedMealsRaw ?? []

  // 計算當日總計
  const dailyTotals = useMemo(() => {
    return selectedMeals.reduce((acc, m) => ({
      protein: acc.protein + Number(m.protein || 0),
      fat: acc.fat + Number(m.fat || 0),
      carb: acc.carb + Number(m.carb || 0),
      kcal: acc.kcal + Number(m.kcal || 0),
    }), { protein: 0, fat: 0, carb: 0, kcal: 0 })
  }, [selectedMeals])

  // 取得可選擇的日期
  const availableDates = useMemo(() => Object.keys(mealsByDate).sort().reverse(), [mealsByDate])

  const handleRemoveMeal = (date, index) => {
    if (confirm('確定要刪除這個餐點嗎？')) removeMeal(date, index)
  }

  const getMealTypeLabel = (type) => {
    const labels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐' }
    return labels[type] || type
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">歷史紀錄</h2>
        
        {/* 日期選擇器 */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">選擇日期</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {new Date(date).toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* 在此日期快速補登 */}
          <form onSubmit={handleSubmit(onQuickAdd)} className="lg:col-span-2 grid grid-cols-1 md:grid-cols-6 gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300">餐別</label>
              <select {...register('type')} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100">
                <option value="breakfast">早餐</option>
                <option value="lunch">午餐</option>
                <option value="dinner">晚餐</option>
                <option value="snack">加餐</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300">名稱（可選）</label>
              <input type="text" {...register('name')} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" placeholder="例如：雞胸沙拉" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300">蛋白(g)</label>
              <input type="number" step="0.1" {...register('protein')} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300">脂肪(g)</label>
              <input type="number" step="0.1" {...register('fat')} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" />
            </div> 
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-300">碳水(g)</label>
              <input type="number" step="0.1" {...register('carb')} className="mt-1 w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100" />
            </div>
            <div className="flex items-end gap-2">
              <label className="inline-flex items-center px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-600 text-sm text-gray-700 dark:text-gray-100 cursor-pointer">
                上傳照片
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
              <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm">新增</button>
            </div>
            {preview && (
              <div className="md:col-span-5">
                <img src={preview} alt="preview" className="h-16 w-16 object-cover rounded border dark:border-gray-600" />
              </div>
            )}
            <p className="md:col-span-5 text-xs text-gray-500 dark:text-gray-400">直接補登到上方選擇的日期：{selectedDate}</p>
          </form>
        </div>

        {/* 當日摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{dailyTotals.protein}g</div>
            <div className="text-sm text-blue-600">蛋白質</div>
            <div className="text-xs text-gray-500">
              目標: {goals.protein}g ({goals.protein ? Math.round((dailyTotals.protein / goals.protein) * 100) : 0}%)
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{dailyTotals.fat}g</div>
            <div className="text-sm text-green-600">脂肪</div>
            <div className="text-xs text-gray-500">
              目標: {goals.fat}g ({goals.fat ? Math.round((dailyTotals.fat / goals.fat) * 100) : 0}%)
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{dailyTotals.carb}g</div>
            <div className="text-sm text-yellow-600">碳水</div>
            <div className="text-xs text-gray-500">
              目標: {goals.carb}g ({goals.carb ? Math.round((dailyTotals.carb / goals.carb) * 100) : 0}%)
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{dailyTotals.kcal}kcal</div>
            <div className="text-sm text-red-600">熱量</div>
            <div className="text-xs text-gray-500">
              目標: {goals.kcal}kcal ({goals.kcal ? Math.round((dailyTotals.kcal / goals.kcal) * 100) : 0}%)
            </div>
          </div>
        </div>

        {/* 餐點列表 */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">餐點詳情</h3>
          {selectedMeals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">這一天沒有餐點紀錄</p>
          ) : (
            <div className="space-y-3">
              {selectedMeals.map((meal, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                draggable
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)) }}
                onDragOver={(e) => { e.preventDefault() }}
                onDrop={(e) => {
                  e.preventDefault()
                  const from = Number(e.dataTransfer.getData('text/plain'))
                  const to = index
                  reorderMeals(selectedDate, from, to)
                }}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {meal.name?.trim() || getMealTypeLabel(meal.type)}
                    </span>
                    {meal.name?.trim() && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-200 dark:bg-gray-600 dark:text-gray-100 dark:border-gray-500">
                        {getMealTypeLabel(meal.type)}
                      </span>
                    )}
                    <div className="flex items-center space-x-3">
                      {meal.photo && (
                        <img src={meal.photo} alt="" className="h-10 w-10 rounded object-cover border dark:border-gray-600" />
                      )}
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          P: {meal.protein}g | F: {meal.fat}g | C: {meal.carb}g
                        </div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                          {meal.kcal} kcal
                      </div>
                   </div>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleRemoveMeal(selectedDate, index)}
              className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-sm"
            >
              刪除
            </button>
            </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
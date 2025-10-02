import { useForm } from 'react-hook-form'
import { useDietStore } from '../stores/useDietStore'
import { macrosToKcal } from '../utils/nutrition'
import { useRef, useState } from 'react'

export default function MealLogger() {
  const addMeal = useDietStore(s => s.addMeal)
  const addMealForDate = useDietStore(s => s.addMealForDate)
  const mealLibrary = useDietStore(s => s.mealLibrary)
  const { register, handleSubmit, reset, setValue, watch } = useForm({ 
    defaultValues: { 
      type: 'breakfast',
      name: '',
      protein: '',
      fat: '',
      carb: '',
      date: (() => { const d = new Date(); const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}` })()
    } 
  })
  const [preview, setPreview] = useState(null)
  const photoDataRef = useRef(null)

  const selectedType = watch('type')

  const onSubmit = (data) => {
    const kcal = macrosToKcal(data)
    const mealPayload = { type: data.type, name: data.name?.trim() || '', protein: data.protein, fat: data.fat, carb: data.carb, kcal, photo: photoDataRef.current || null }
    if (data.date) {
      addMealForDate(data.date, mealPayload)
    } else {
      addMeal(mealPayload)
    }
    reset({ type: data.type, name: '', protein: '', fat: '', carb: '', date: data.date })
    setPreview(null)
    photoDataRef.current = null
  }

  const quickAddFromLibrary = (meal) => {
    setValue('name', meal.name || '')
    setValue('protein', meal.protein)
    setValue('fat', meal.fat)
    setValue('carb', meal.carb)
  }

  const filteredLibrary = mealLibrary.filter(meal => 
    meal.type === selectedType || !meal.type
  )

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) {
      setPreview(null)
      photoDataRef.current = null
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      photoDataRef.current = dataUrl
      setPreview(dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">新增餐點</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">名稱（可選）</label>
          <input 
            type="text"
            placeholder="例如：雞胸沙拉、拿鐵"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">餐別</label>
          <select 
            {...register('type')} 
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="breakfast">早餐</option>
            <option value="lunch">午餐</option>
            <option value="dinner">晚餐</option>
            <option value="snack">加餐</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">日期</label>
          <input
            type="date"
            {...register('date')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">可回填過去日期以補登餐點</p>
        </div>

        {filteredLibrary.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              快速選擇
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
              {filteredLibrary.map((meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => quickAddFromLibrary(meal)}
                  className="text-left p-2 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{meal.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-300">
                    P: {meal.protein}g F: {meal.fat}g C: {meal.carb}g
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">蛋白質(g)</span>
            <input 
              type="number" 
              step="0.1" 
              {...register('protein')} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" 
            />
          </label>
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">脂肪(g)</span>
            <input 
              type="number" 
              step="0.1" 
              {...register('fat')} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" 
            />
          </label>
          <label>
            <span className="text-sm text-gray-700 dark:text-gray-300">碳水(g)</span>
            <input 
              type="number" 
              step="0.1" 
              {...register('carb')} 
              className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" 
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">餐點照片（可選）</label>
          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="mt-1 block w-full text-sm text-gray-700 dark:text-gray-100"
          />
          {preview && (
            <div className="mt-2">
              <img src={preview} alt="preview" className="h-24 w-24 object-cover rounded-md border dark:border-gray-600" />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          加入餐點
        </button>
      </form>
    </div>
  )
}
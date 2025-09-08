import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDietStore } from '../stores/useDietStore'
import { calcBMR, calcTDEE } from '../utils/nutrition'
import * as yup from 'yup';

const schema = yup.object({
  name: yup.string().required('請輸入姓名'),
  height: yup.number().positive('身高必須大於0').required('請輸入身高'),
  weight: yup.number().positive('體重必須大於0').required('請輸入體重'),
  age: yup.number().positive('年齡必須大於0').required('請輸入年齡'),
  gender: yup.string().required('請選擇性別'),
  activityLevel: yup.string().required('請選擇活動量'),
}).required();

export default function UserProfileForm() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema)
  });

  const setProfile = useDietStore(s => s.setProfile)
  const profile = useDietStore(s => s.profile)

  const watchedValues = watch()
  const bmr = watchedValues.height && watchedValues.weight && watchedValues.age && watchedValues.gender && watchedValues.activityLevel 
    ? calcBMR(watchedValues)
    : 0
  const tdee = bmr && watchedValues.activityLevel ? calcTDEE(bmr, watchedValues.activityLevel) : 0

  const onSubmit = (data) => {
    const calculatedBmr = calcBMR(data)
    const calculatedTdee = calcTDEE(calculatedBmr, data.activityLevel)
    const payload = { ...data, bmr: calculatedBmr, tdee: calculatedTdee }
    setProfile(payload)
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">基本資料</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">姓名</label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">身高 (cm)</label>
          <input
            type="number"
            {...register('height')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          {errors.height && <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">體重 (kg)</label>
          <input
            type="number"
            {...register('weight')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          {errors.weight && <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">年齡</label>
          <input
            type="number"
            {...register('age')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          />
          {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">性別</label>
          <select
            {...register('gender')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">請選擇</option>
            <option value="male">男性</option>
            <option value="female">女性</option>
          </select>
          {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">活動量</label>
          <select
            {...register('activityLevel')}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
          >
            <option value="">請選擇</option>
            <option value="sedentary">久坐</option>
            <option value="moderate">中度活動</option>
            <option value="active">高活動</option>
          </select>
          {errors.activityLevel && <p className="text-red-500 text-sm mt-1">{errors.activityLevel.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          儲存資料
        </button>
      </form>

      {/* 計算結果顯示 */}
      {(bmr > 0 || tdee > 0) && (
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">計算結果</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">估算 BMR:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{bmr} kcal</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">估算 TDEE:</span>
              <span className="text-gray-900 dark:text-gray-100 font-medium">{tdee} kcal</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
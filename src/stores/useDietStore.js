import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getSupabase } from '../utils/supabaseClient'
import { calcBMR, calcTDEE } from '../utils/nutrition'

// module-level timers for debounced push
let pushTimer = null

// Local-date key in YYYY-MM-DD using local timezone (avoid UTC boundary issues)
const formatLocalDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const todayKey = () => formatLocalDate(new Date())

export const useDietStore = create(persist((set, get) => ({
  profile: null,
  setProfile: (p) => {
    set({ profile: p })
    get().schedulePush()
  },

  goals: { protein: 0, fat: 0, carb: 0, kcal: 0 },
  setGoals: (g) => {
    set({ goals: { ...get().goals, ...g } })
    get().schedulePush()
  },

  // 偏好設定 - 預設深色模式
  preferences: { darkMode: true },
  setPreference: (key, value) => set({ preferences: { ...get().preferences, [key]: value } }),
  toggleDarkMode: () => set({ preferences: { ...get().preferences, darkMode: !get().preferences?.darkMode } }),

  // 短期目標
  shortTermGoal: null,
  setShortTermGoal: (goal) => set({ shortTermGoal: goal }),

  mealLibrary: [],
  addPreset: (preset) => {
    set({ mealLibrary: [...get().mealLibrary, { id: crypto.randomUUID(), ...preset }] })
    get().schedulePush()
  },
  removePreset: (id) => {
    set({ mealLibrary: get().mealLibrary.filter(p => p.id !== id) })
    get().schedulePush()
  },
  setMealLibrary: (list) => {
    set({ mealLibrary: list })
    get().schedulePush()
  },
  clearMealLibrary: () => {
    set({ mealLibrary: [] })
    get().schedulePush()
  },

  mealsByDate: {},
  // 每日期總計快取，結構：{ [YYYY-MM-DD]: { protein, fat, carb, kcal } }
  mealsTotalsByDate: {},

  // 內部：計算單日總計
  _computeTotals: (list) => list.reduce((acc, m) => ({
    protein: acc.protein + Number(m.protein || 0),
    fat: acc.fat + Number(m.fat || 0),
    carb: acc.carb + Number(m.carb || 0),
    kcal: acc.kcal + Number(m.kcal || 0),
  }), { protein: 0, fat: 0, carb: 0, kcal: 0 }),

  // 內部：重算某日快取
  _recalcDateTotals: (dateKey) => {
    const list = get().mealsByDate[dateKey] || []
    const totals = get()._computeTotals(list)
    set({ mealsTotalsByDate: { ...get().mealsTotalsByDate, [dateKey]: totals } })
  },

  // 內部：重算全部快取（匯入/大量異動時使用）
  _recalcAllTotals: () => {
    const byDate = get().mealsByDate
    const compute = get()._computeTotals
    const totals = {}
    for (const key of Object.keys(byDate)) {
      totals[key] = compute(byDate[key] || [])
    }
    set({ mealsTotalsByDate: totals })
  },
  addMeal: (meal) => {
    const d = todayKey()
    const list = get().mealsByDate[d] || []
    set({ mealsByDate: { ...get().mealsByDate, [d]: [...list, meal] } })
    get()._recalcDateTotals(d)
    get().schedulePush()
  },
  // 依指定日期新增餐點（YYYY-MM-DD）
  addMealForDate: (date, meal) => {
    const key = date || todayKey()
    const list = get().mealsByDate[key] || []
    set({ mealsByDate: { ...get().mealsByDate, [key]: [...list, meal] } })
    get()._recalcDateTotals(key)
    get().schedulePush()
  },

  // 體重追蹤
  weightHistory: [],
  addWeightRecord: (record) => {
    const history = get().weightHistory
    const existingIndex = history.findIndex(h => h.date === record.date)
    if (existingIndex >= 0) {
      const newHistory = [...history]
      newHistory[existingIndex] = record
      set({ weightHistory: newHistory })
    } else {
      set({ weightHistory: [...history, record] })
    }

    // 同步更新個人資料中的體重，並在可計算時更新 BMR/TDEE
    const currentProfile = get().profile
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, weight: Number(record.weight) }
      try {
        const canCalc =
          updatedProfile.gender &&
          updatedProfile.height &&
          updatedProfile.weight &&
          updatedProfile.age &&
          updatedProfile.activityLevel
        if (canCalc) {
          const bmr = calcBMR({
            gender: updatedProfile.gender,
            weight: updatedProfile.weight,
            height: updatedProfile.height,
            age: updatedProfile.age,
          })
          const tdee = calcTDEE(bmr, updatedProfile.activityLevel)
          updatedProfile.bmr = bmr
          updatedProfile.tdee = tdee
        }
      } catch {}
      set({ profile: updatedProfile })
    }
    get().schedulePush()
  },

  // 移除餐點
  removeMeal: (date, index) => {
    const list = get().mealsByDate[date] || []
    const newList = list.filter((_, i) => i !== index)
    set({ mealsByDate: { ...get().mealsByDate, [date]: newList } })
    get()._recalcDateTotals(date)
    get().schedulePush()
  },

  todayTotals: () => {
    const d = todayKey()
    return get().mealsTotalsByDate[d] || { protein: 0, fat: 0, carb: 0, kcal: 0 }
  },

  getMealsByDate: (date) => get().mealsByDate[date] || [],

  getDateRangeStats: (startDate, endDate) => {
    const totalsMap = get().mealsTotalsByDate
    const stats = []
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const dateKey = formatLocalDate(d)
      const totals = totalsMap[dateKey] || { protein: 0, fat: 0, carb: 0, kcal: 0 }
      stats.push({ date: dateKey, ...totals })
    }
    return stats
  },

  // 匯出/匯入全域資料（備份/還原）
  exportAll: () => {
    const state = get()
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: state.profile,
      goals: state.goals,
      preferences: state.preferences,
      shortTermGoal: state.shortTermGoal,
      mealLibrary: state.mealLibrary,
      mealsByDate: state.mealsByDate,
      weightHistory: state.weightHistory,
    }
    return payload
  },
  importAll: (data) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (!parsed || typeof parsed !== 'object') throw new Error('格式錯誤')

      set({
        profile: parsed.profile ?? null,
        goals: parsed.goals ?? { protein: 0, fat: 0, carb: 0, kcal: 0 },
        preferences: parsed.preferences ?? { darkMode: true },
        shortTermGoal: parsed.shortTermGoal ?? null,
        mealLibrary: Array.isArray(parsed.mealLibrary) ? parsed.mealLibrary : [],
        mealsByDate: parsed.mealsByDate ?? {},
        weightHistory: Array.isArray(parsed.weightHistory) ? parsed.weightHistory : [],
      })
      get()._recalcAllTotals()
      get().schedulePush()
      return { ok: true }
    } catch (e) {
      return { ok: false, error: e?.message || String(e) }
    }
  },

  // Supabase 設定與同步（簡易 JSON Blob）
  // 預設啟用雲端備份（需在設定中填入 userId 與 .env）
  cloud: { enabled: true, userId: null, lastSyncAt: null, strategy: 'local_wins', auto: true, syncing: false, error: null },
  setCloud: (patch) => set({ cloud: { ...get().cloud, ...patch } }),
  schedulePush: () => {
    const cloud = get().cloud
    if (!cloud?.auto) return
    if (!cloud?.userId) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      get().pushToCloud().catch((e) => {
        set({ cloud: { ...get().cloud, error: e?.message || String(e) } })
      })
    }, 3000)
  },
  pushToCloud: async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('未設定 Supabase 環境變數')
    const { userId } = get().cloud || {}
    if (!userId) throw new Error('請先在設定中填寫使用者 ID')
    set({ cloud: { ...get().cloud, syncing: true, error: null } })
    const payload = get().exportAll()
    const { data, error } = await supabase
      .from('diet_backups')
      .upsert({ user_id: userId, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select('updated_at')
      .single()
    if (error) {
      set({ cloud: { ...get().cloud, syncing: false, error: error.message } })
      throw error
    }
    set({ cloud: { ...get().cloud, syncing: false, lastSyncAt: data?.updated_at || new Date().toISOString(), error: null } })
    return { ok: true }
  },
  pullFromCloud: async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('未設定 Supabase 環境變數')
    const { userId } = get().cloud || {}
    if (!userId) throw new Error('請先在設定中填寫使用者 ID')
    set({ cloud: { ...get().cloud, syncing: true, error: null } })
    const { data, error } = await supabase
      .from('diet_backups')
      .select('data, updated_at')
      .eq('user_id', userId)
      .single()
    if (error) {
      set({ cloud: { ...get().cloud, syncing: false, error: error.message } })
      throw error
    }
    const strategy = get().cloud?.strategy || 'local_wins'
    if (strategy === 'remote_wins') {
      const res = get().importAll(data?.data)
      if (!res.ok) {
        set({ cloud: { ...get().cloud, syncing: false, error: res.error } })
        throw new Error(res.error || '匯入失敗')
      }
    } else {
      // local_wins: 什麼都不做；可擴充為比較 lastSyncAt 再決定
    }
    set({ cloud: { ...get().cloud, syncing: false, lastSyncAt: data?.updated_at || get().cloud.lastSyncAt, error: null } })
    return { ok: true }
  },

  // 清除所有資料
  clearAll: () => {
    set({
      profile: null,
      goals: { protein: 0, fat: 0, carb: 0, kcal: 0 },
      preferences: { darkMode: true }, // 保持深色模式
      shortTermGoal: null,
      mealLibrary: [],
      mealsByDate: {},
      weightHistory: [],
      mealsTotalsByDate: {},
    })
    try { localStorage.removeItem('diet-tracker') } catch {}
  }
}), { name: 'diet-tracker' }))
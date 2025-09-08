import { useEffect } from 'react'
import { useDietStore } from '../stores/useDietStore'
import UserProfileForm from './UserProfileForm'
import GoalSetter from './GoalSetter'
import MealLogger from './MealLogger'
import TodayProgress from './TodayProgress'
import MealLibrary from './MealLibrary'
import StatisticsPage from './StatisticsPage'
import History from './History'
import WeightTracker from './WeightTracker'
import Settings from './Settings'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AISuggestions from './AISuggestions'

function RequireProfile({ children }) {
  const profile = useDietStore(s => s.profile)
  if (!profile) return <Navigate to="/profile" replace />
  return children
}

function RequireGoals({ children }) {
  const goals = useDietStore(s => s.goals)
  const hasGoals = !!(goals && (goals.protein || goals.fat || goals.carb || goals.kcal))
  if (!hasGoals) return <Navigate to="/goals" replace />
  return children
}

export default function Dashboard() {
    const profile = useDietStore(s => s.profile)
    const location = useLocation()

    const preferences = useDietStore(s => s.preferences)
    
    // 確保深色模式在組件載入時立即生效
    useEffect(() => {
      const isDark = preferences?.darkMode ?? true // 預設深色
      document.documentElement.classList.toggle('dark', isDark)
    }, [preferences?.darkMode])

    const tabs = [
      { id: 'overview', label: '今日概覽', icon: '📊' },
      { id: 'profile', label: '個人資料', icon: '👤' },
      { id: 'goals', label: '目標設定', icon: '🎯' },
      { id: 'meals', label: '餐點紀錄', icon: '🍽️' },
      { id: 'library', label: '餐點庫', icon: '📚' },
      { id: 'history', label: '歷史紀錄', icon: '📅' },
      { id: 'statistics', label: '統計分析', icon: '📈' },
      { id: 'weight', label: '體重追蹤', icon: '⚖️' },
      { id: 'settings', label: '設定', icon: '⚙️' }
    ]

    // 交由路由守衛處理未建立 profile 的情況

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/80 backdrop-blur border-b dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                🍽️ 飲食控制系統
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                歡迎回來，{profile.name}！
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-300">BMR: {profile.bmr} kcal</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">TDEE: {profile.tdee} kcal</p>
                        </div>
                    </div>
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-800" />
            </header>

            {/* Navigation Tabs */}
            <nav className="bg-white dark:bg-gray-900 border-b dark:border-gray-800 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <NavLink
                                key={tab.id}
                                to={`/${tab.id}`}
                                className={({ isActive }) =>
                                    `py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                                        isActive
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`
                                }
                            >
                                <span className="mr-2">{tab.icon}</span>
                                {tab.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Bottom navigation (mobile) */}
            <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/90 border-t dark:border-gray-800 backdrop-blur">
                <div className="max-w-7xl mx-auto px-2">
                    <div className="grid grid-cols-5">
                        {tabs.filter(t => ['overview','meals','library','history','settings'].includes(t.id)).map(tab => (
                            <NavLink
                                key={tab.id}
                                to={`/${tab.id}`}
                                className={({ isActive }) =>
                                    `flex flex-col items-center justify-center py-2 text-xs ${
                                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                                    }`
                                }
                            >
                                <span className="text-lg leading-none">{tab.icon}</span>
                                <span className="mt-0.5">{tab.label}</span>
                            </NavLink>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 md:pb-6 pb-24">
                <div className="px-4 py-6 sm:px-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Routes>
                                <Route path="/" element={<Navigate to="/overview" replace />} />
                                <Route path="/overview" element={
                                    <RequireProfile>
                                      <RequireGoals>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* 左側：今日進度 + AI 建議（等高） */}
                                            <div className="grid grid-rows-2 gap-6 auto-rows-fr">
                                                <div className="h-full">
                                                    <TodayProgress />
                                                </div>
                                                <div className="h-full">
                                                    <AISuggestions />
                                                </div>
                                            </div>
                                            {/* 右側：目標設定 + 新增餐點 */}
                                            <div className="flex flex-col gap-6">
                                                <GoalSetter />
                                                <MealLogger />
                                            </div>
                                        </div>
                                      </RequireGoals>
                                    </RequireProfile>
                                } />

                                <Route path="/profile" element={<div className="max-w-2xl mx-auto"><UserProfileForm /></div>} />
                                <Route path="/goals" element={<RequireProfile><div className="max-w-2xl mx-auto"><GoalSetter /></div></RequireProfile>} />
                                <Route path="/meals" element={
                                    <RequireProfile>
                                      <RequireGoals>
                                        <div className="max-w-4xl mx-auto">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                <MealLogger />
                                                <TodayProgress />
                                            </div>
                                        </div>
                                      </RequireGoals>
                                    </RequireProfile>
                                } />
                                <Route path="/library" element={<RequireProfile><div className="max-w-4xl mx-auto"><MealLibrary /></div></RequireProfile>} />
                                <Route path="/history" element={<RequireProfile><History /></RequireProfile>} />
                                <Route path="/statistics" element={<RequireProfile><StatisticsPage /></RequireProfile>} />
                                <Route path="/weight" element={<RequireProfile><WeightTracker /></RequireProfile>} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<Navigate to="/overview" replace />} />
                            </Routes>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
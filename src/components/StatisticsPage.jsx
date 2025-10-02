import { useState, useMemo } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useDietStore } from '../stores/useDietStore'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState('week')
  const [chartType, setChartType] = useState('line')
  
  const goals = useDietStore(s => s.goals)
  const getDateRangeStats = useDietStore(s => s.getDateRangeStats)
  const profile = useDietStore(s => s.profile)

  // 計算日期範圍
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    
    if (timeRange === 'week') {
      start.setDate(end.getDate() - 7)
    } else if (timeRange === 'month') {
      start.setMonth(end.getMonth() - 1)
    } else if (timeRange === 'month3') {
      start.setMonth(end.getMonth() - 3)
    }
    
    const fmt = (d) => {
      const y = d.getFullYear(); const m = String(d.getMonth()+1).padStart(2,'0'); const dd = String(d.getDate()).padStart(2,'0');
      return `${y}-${m}-${dd}`
    }
    return { start: fmt(start), end: fmt(end) }
  }, [timeRange])

  // 取得統計數據
  const statsData = useMemo(() => {
    const { start, end } = dateRange
    const raw = getDateRangeStats(start, end)
    return raw.map((r) => ({
      date: new Date(r.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
      protein: r.protein,
      fat: r.fat,
      carb: r.carb,
      kcal: r.kcal,
      proteinPct: goals.protein ? Math.round((r.protein / goals.protein) * 100) : 0,
      fatPct: goals.fat ? Math.round((r.fat / goals.fat) * 100) : 0,
      carbPct: goals.carb ? Math.round((r.carb / goals.carb) * 100) : 0,
      kcalPct: goals.kcal ? Math.round((r.kcal / goals.kcal) * 100) : 0,
    }))
  }, [dateRange, goals, getDateRangeStats])

  // 計算平均值
  const averages = useMemo(() => {
    if (statsData.length === 0) return {}
    
    const totals = statsData.reduce((acc, day) => ({
      protein: acc.protein + day.protein,
      fat: acc.fat + day.fat,
      carb: acc.carb + day.carb,
      kcal: acc.kcal + day.kcal,
    }), { protein: 0, fat: 0, carb: 0, kcal: 0 })
    
    return {
      protein: Math.round(totals.protein / statsData.length),
      fat: Math.round(totals.fat / statsData.length),
      carb: Math.round(totals.carb / statsData.length),
      kcal: Math.round(totals.kcal / statsData.length),
    }
  }, [statsData])

  // 營養素佔比數據
  const pieData = useMemo(() => {
    const avg = averages
    const total = avg.protein + avg.fat + avg.carb
    if (total === 0) return []
    
    return [
      { name: '蛋白質', value: avg.protein, color: '#0088FE' },
      { name: '脂肪', value: avg.fat, color: '#00C49F' },
      { name: '碳水', value: avg.carb, color: '#FFBB28' },
    ]
  }, [averages])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">營養統計分析</h2>
        
        {/* 控制選項 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">時間範圍</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="week">最近一週</option>
              <option value="month">最近一個月</option>
              <option value="month3">最近三個月</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">圖表類型</label>
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="line">折線圖</option>
              <option value="bar">長條圖</option>
            </select>
          </div>
        </div>

        {/* 平均值摘要 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{averages.protein}g</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">平均蛋白質</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{averages.fat}g</div>
            <div className="text-sm text-green-600 dark:text-green-400">平均脂肪</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{averages.carb}g</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">平均碳水</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{averages.kcal}kcal</div>
            <div className="text-sm text-red-600 dark:text-red-400">平均熱量</div>
          </div>
        </div>

        {/* 主要圖表 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 營養素趨勢圖 */}
          <div className="lg:col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">營養素攝取趨勢</h3>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'line' ? (
                <LineChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="protein" stroke="#0088FE" name="蛋白質" />
                  <Line type="monotone" dataKey="fat" stroke="#00C49F" name="脂肪" />
                  <Line type="monotone" dataKey="carb" stroke="#FFBB28" name="碳水" />
                </LineChart>
              ) : (
                <BarChart data={statsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="protein" fill="#0088FE" name="蛋白質" />
                  <Bar dataKey="fat" fill="#00C49F" name="脂肪" />
                  <Bar dataKey="carb" fill="#FFBB28" name="碳水" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* 營養素佔比圓餅圖 */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">營養素佔比</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 達成率圖表 */}
        <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">目標達成率</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Legend />
              <Bar dataKey="proteinPct" fill="#0088FE" name="蛋白質達成率" />
              <Bar dataKey="fatPct" fill="#00C49F" name="脂肪達成率" />
              <Bar dataKey="carbPct" fill="#FFBB28" name="碳水達成率" />
              <Bar dataKey="kcalPct" fill="#FF8042" name="熱量達成率" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
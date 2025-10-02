import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useDietStore } from '../stores/useDietStore'

export default function WeightTracker() {
  const [newWeight, setNewWeight] = useState('')
  const localToday = new Date()
  const yyyy = localToday.getFullYear()
  const mm = String(localToday.getMonth() + 1).padStart(2, '0')
  const dd = String(localToday.getDate()).padStart(2, '0')
  const [newDate, setNewDate] = useState(`${yyyy}-${mm}-${dd}`)
  
  const profile = useDietStore(s => s.profile)
  const weightHistory = useDietStore(s => s.weightHistory || [])
  const addWeightRecord = useDietStore(s => s.addWeightRecord)

  const handleAddWeight = () => {
    if (newWeight && newDate) {
      addWeightRecord({
        date: newDate,
        weight: parseFloat(newWeight)
      })
      setNewWeight('')
      const now = new Date()
      const y = now.getFullYear()
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      setNewDate(`${y}-${m}-${d}`)
    }
  }

  const chartData = useMemo(() => {
    return weightHistory
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(record => ({
        date: new Date(record.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' }),
        weight: record.weight
      }))
  }, [weightHistory])

  const latestWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : profile?.weight
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weight : profile?.weight
  const weightChange = latestWeight - startWeight

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">體重追蹤</h2>
        
        {/* 新增體重紀錄 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">體重 (kg)</label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              placeholder="輸入體重"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">日期</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddWeight}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              新增紀錄
            </button>
          </div>
        </div>

        {/* 體重摘要 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{latestWeight} kg</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">目前體重</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{startWeight} kg</div>
            <div className="text-sm text-green-600 dark:text-green-400">起始體重</div>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            weightChange > 0 ? 'bg-red-50 dark:bg-red-900/20' : weightChange < 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'
          }`}>
            <div className={`text-2xl font-bold ${
              weightChange > 0 ? 'text-red-600 dark:text-red-400' : weightChange < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">體重變化</div>
          </div>
        </div>

        {/* 體重變化圖表 */}
        {chartData.length > 1 && (
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">體重變化趨勢</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
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
                <Line type="monotone" dataKey="weight" stroke="#0088FE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* 體重紀錄列表 */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">體重紀錄</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {weightHistory
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((record, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-300">
                    {new Date(record.date).toLocaleDateString('zh-TW')}
                  </span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{record.weight} kg</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
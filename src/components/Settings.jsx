import { useEffect } from 'react'
import { useDietStore } from '../stores/useDietStore'

export default function Settings() {
  const darkMode = useDietStore(s => s.preferences?.darkMode)
  const toggleDarkMode = useDietStore(s => s.toggleDarkMode)
  const clearAll = useDietStore(s => s.clearAll)
  const exportAll = useDietStore(s => s.exportAll)
  const importAll = useDietStore(s => s.importAll)
  const cloud = useDietStore(s => s.cloud)
  const setCloud = useDietStore(s => s.setCloud)
  const pushToCloud = useDietStore(s => s.pushToCloud)
  const pullFromCloud = useDietStore(s => s.pullFromCloud)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', !!darkMode)
  }, [darkMode])

  const handleClearAll = () => {
    if (confirm('確定要清除所有資料嗎？此動作無法復原。')) {
      clearAll()
      // 重新載入頁面以重置狀態
      window.location.reload()
    }
  }

  const handleExport = () => {
    const payload = exportAll()
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diet-tracker-backup-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file) => {
    if (!file) return
    try {
      const text = await file.text()
      const result = importAll(text)
      if (!result.ok) throw new Error(result.error || '匯入失敗')
      alert('匯入成功！')
    } catch (e) {
      alert('匯入失敗：' + (e?.message || String(e)))
    }
  }


  const handlePush = async () => {
    try {
      const res = await pushToCloud()
      alert('上傳成功！')
    } catch (e) {
      alert('上傳失敗：' + (e?.message || String(e)))
    }
  }

  const handlePull = async () => {
    try {
      const res = await pullFromCloud()
      alert('下載成功！')
    } catch (e) {
      alert('下載失敗：' + (e?.message || String(e)))
    }
  }


  return (
    <div className="max-w-xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">設定</h2>


      
      

      

      {/* 資料管理 */}


      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">資料管理</h3>
        


        {/* 雲端同步（Supabase） */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">雲端同步（Supabase）</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">請先於 .env 設定 `VITE_SUPABASE_URL` 與 `VITE_SUPABASE_ANON_KEY`，並在資料庫建立表 `diet_backups(user_id text primary key, data jsonb, updated_at timestamptz)`。</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="md:col-span-2">
                <span className="block text-sm text-gray-700 dark:text-gray-300">使用者 ID（自訂識別碼）</span>
                <input
                  value={cloud?.userId || ''}
                  onChange={(e) => setCloud({ userId: e.target.value })}
                  placeholder="例如：my-email-or-uuid"
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
                />
              </label>
              <div className="flex items-end gap-2">
                <button onClick={handlePush} className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white">上傳</button>
                <button onClick={handlePull} className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white">下載</button>
              </div>
            </div>

            {/* 同步設定 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label>
                <span className="block text-sm text-gray-700 dark:text-gray-300">衝突策略</span>
                <select
                  value={cloud?.strategy || 'local_wins'}
                  onChange={(e) => setCloud({ strategy: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-100"
                >
                  <option value="local_wins">本機優先（local_wins）</option>
                  <option value="remote_wins">雲端優先（remote_wins）</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!cloud?.auto}
                  onChange={(e) => setCloud({ auto: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">自動同步（變更後 3 秒上傳）</span>
              </label>

              <div className="flex items-center gap-2">
                {cloud?.syncing ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">同步中…</span>
                ) : cloud?.error ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">錯誤</span>
                ) : cloud?.lastSyncAt ? (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">已同步</span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">尚未同步</span>
                )}
              </div>
            </div>

            {/* 狀態資訊 */}
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {cloud?.lastSyncAt && <div>最後同步：{new Date(cloud.lastSyncAt).toLocaleString()}</div>}
              {cloud?.error && (
                <div className="flex items-center gap-2">
                  <span>錯誤訊息：{cloud.error}</span>
                  <button onClick={handlePush} className="px-2 py-1 rounded bg-red-600 text-white">重試上傳</button>
                </div>
              )}
            </div>
          </div>
        </div>

        
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[240px]">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">匯出/匯入資料</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">包含個人資料、目標、餐點庫、餐點紀錄、體重紀錄與偏好設定。</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors">匯出</button>
              <label className="px-4 py-2 rounded-md bg-slate-600 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer">
                匯入
                <input type="file" accept="application/json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
              </label>
            </div>
          </div>
        </div>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-red-900 dark:text-red-100">清除所有資料</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                此動作將清除所有個人資料、餐點紀錄、體重紀錄等，無法復原。
              </p>
            </div>
            <button
              onClick={handleClearAll}
              className="ml-4 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
            >
              清除資料
            </button>
          </div>
        </div>
      </div>

      {/* 應用程式資訊 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">應用程式資訊</h3>
        
        

        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">版本</span>
              <span className="text-gray-900 dark:text-gray-100">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">資料儲存</span>
              <span className="text-gray-900 dark:text-gray-100">本機儲存</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">開發者</span>
              <span className="text-gray-900 dark:text-gray-100">飲食控制系統</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
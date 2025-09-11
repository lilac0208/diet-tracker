import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import { useDietStore } from './stores/useDietStore'

function App() {
  // 啟動時若已設定雲端同步，嘗試自動拉取一次遠端資料
  const cloud = useDietStore(s => s.cloud)
  const pullFromCloud = useDietStore(s => s.pullFromCloud)

  useEffect(() => {
    // 條件：有 userId 且開啟 auto，同時本機沒有任何資料（或尚未同步過）
    const shouldAutoPull = cloud?.auto && cloud?.userId && !cloud?.lastSyncAt
    if (shouldAutoPull) {
      pullFromCloud().catch(() => {})
    }
    // 僅在初次掛載時檢查一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/overview" replace />} />
      <Route path="/*" element={<Dashboard />} />
    </Routes>
  )
}

export default App
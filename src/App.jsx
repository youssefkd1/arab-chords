import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import BottomBar from './components/layout/BottomBar'
import Home from './pages/Home'
import Artists from './pages/Artists'
import Playlists from './pages/Playlists'
import Favorites from './pages/Favorites'
import Recents from './pages/Recents'
import Settings from './pages/Settings'
import Songs from './pages/Songs'
import SongChart from './pages/SongChart'
import Charts from './pages/Charts'
import { SongsProvider } from './context/SongsContext.jsx'
import { PlaylistsProvider } from './context/PlaylistsContext.jsx'
import { useState, useEffect } from 'react'

const STORAGE_KEYS = {
  fontSize: 'arab-chords-font-size',
  compactView: 'arab-chords-compact-view',
}

function getStoredSetting(key, fallback) {
  if (typeof window === 'undefined') return fallback
  return window.localStorage.getItem(key) ?? fallback
}

export function App() {
  const [fontSize, setFontSize] = useState(() => getStoredSetting(STORAGE_KEYS.fontSize, 'medium'))
  const [compactView, setCompactView] = useState(() => getStoredSetting(STORAGE_KEYS.compactView, 'false') === 'true')

  useEffect(() => {
    const applySettings = () => {
      const savedFontSize = getStoredSetting(STORAGE_KEYS.fontSize, 'medium')
      const savedCompactView = getStoredSetting(STORAGE_KEYS.compactView, 'false') === 'true'

      setFontSize(savedFontSize)
      setCompactView(savedCompactView)
    }

    applySettings()
    window.addEventListener('settings-changed', applySettings)
    return () => window.removeEventListener('settings-changed', applySettings)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const fontScale = fontSize === 'small' ? '15px' : fontSize === 'large' ? '18px' : '16px'

    root.classList.toggle('compact', compactView)
    root.style.fontSize = fontScale
    document.body.style.backgroundColor = '#f5efe2'
    document.body.style.color = '#1f2933'
  }, [fontSize, compactView])

  return (
    <Router>
      <SongsProvider>
        <PlaylistsProvider>
          <div className="app-shell flex flex-col md:flex-row h-screen w-screen overflow-hidden font-sans transition-colors duration-200 text-slate-900">
            <Sidebar />
            <main className="app-main flex-1 h-full overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/artists" element={<Artists />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/recents" element={<Recents />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/songs" element={<Songs />} />
                <Route path="/songs/:songId" element={<SongChart />} />
                <Route path="/charts" element={<Charts />} />
              </Routes>
            </main>
            <BottomBar />
          </div>
        </PlaylistsProvider>
      </SongsProvider>
    </Router>
  )
}


export default App

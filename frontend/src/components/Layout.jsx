import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquarePlus, BrainCircuit, Sparkles,
  BarChart3, LineChart, Settings, ChevronRight, Bell, Search,
  User, Cpu, Database, Calendar, Menu, X, ChevronDown, Activity,
  Zap, Globe, Sun, Moon
} from 'lucide-react'

const navItems = [
  { path: '/',            icon: LayoutDashboard,  label: 'Dashboard' },
  { path: '/submit',      icon: MessageSquarePlus, label: 'Submit Feedback' },
  { path: '/topics',      icon: BrainCircuit,      label: 'Topic Modeling' },
  { path: '/responses',   icon: Sparkles,          label: 'Response Generation' },
  { path: '/evaluation',  icon: BarChart3,          label: 'Evaluation Metrics' },
  { path: '/analytics',   icon: LineChart,          label: 'Analytics' },
  { path: '/settings',    icon: User,              label: 'User' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  const currentPage = navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  return (
    <div className="flex h-screen overflow-hidden bg-surface-900">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} flex-shrink-0 flex flex-col bg-surface-800 border-r border-white/5 transition-all duration-300 relative`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/5 overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-blue">
            <Zap size={16} className="text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <div className="font-display font-bold text-white text-sm leading-tight whitespace-nowrap">FeedNora</div>
              {/*<div className="text-[10px] text-brand-400 whitespace-nowrap">Intelligence Platform</div>*/}
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'text-white bg-brand-600/20 border border-brand-600/30 shadow-glow-blue/30'
                    : 'text-slate-400 hover:text-white hover:bg-surface-700'
                }`}
              >
                <Icon size={17} className={`flex-shrink-0 ${active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
                {sidebarOpen && active && <ChevronRight size={13} className="ml-auto text-brand-400" />}
              </button>
            )
          })}
        </nav>

        {/* Model Info 
        {sidebarOpen && (
          <div className="px-3 py-3 mx-2 mb-3 rounded-xl bg-surface-700/50 border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Cpu size={12} className="text-accent-cyan" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Model Stack</span>
            </div>
            <div className="text-[11px] text-slate-300 font-mono leading-relaxed">
              <div>Dynamic LDA v2.2</div>
              <div>T5-Base Generator</div>
              <div>LR Classifier v3.1</div>
            </div>
          </div>
        )*/}

        {/* Collapse btn */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="absolute -right-3 top-20 w-6 h-6 bg-surface-600 border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
        >
          <ChevronRight size={12} className={`transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 flex items-center gap-4 px-6 bg-surface-800/70 backdrop-blur border-b border-white/5 flex-shrink-0">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Platform</span>
            <ChevronRight size={13} className="text-slate-600" />
            <span className="text-slate-200 font-medium">{currentPage}</span>
          </div>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 ml-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-green dot-pulse" />
            <span className="text-[11px] text-accent-green font-medium">LIVE</span>
          </div>

          <div className="flex-1" />

          {/* Dataset pill 
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-700 rounded-lg border border-white/5">
            <Database size={12} className="text-brand-400" />
            <span className="text-[11px] text-slate-400">24,718 records</span>
          </div>*/}

          <button
            onClick={toggleTheme}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-700 rounded-lg border border-white/5 text-slate-400 hover:text-white hover:bg-surface-600 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={12} className="text-accent-amber" /> : <Moon size={12} className="text-brand-500" />}
            <span className="text-[11px]">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {/* Date range 
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-surface-700 rounded-lg border border-white/5 cursor-pointer hover:bg-surface-600 transition-colors">
            <Calendar size={12} className="text-slate-400" />
            <span className="text-[11px] text-slate-400">Aug 2024 — Mar 2025</span>
          </div>*/}

          {/* Lang */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-surface-700 rounded-lg border border-white/5">
            <Globe size={12} className="text-accent-cyan" />
            <span className="text-[11px] text-slate-400">EN / SI / TA</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(v => !v)}
              className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-700 text-slate-400 hover:text-white transition-colors"
            >
              <Bell size={16} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent-red rounded-full" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-72 card z-50 p-3 space-y-2 animate-fade-in">
                <div className="label px-1 pb-1">Recent Alerts</div>
                {[
                  { msg: 'Delivery complaints spiked 23% today', time: '5m', color: 'accent-red' },
                  { msg: 'Model v2.2 deployed successfully', time: '1h', color: 'accent-green' },
                  { msg: '1,247 AI responses generated today', time: '2h', color: 'brand-400' },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-700 cursor-pointer">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 bg-${n.color} flex-shrink-0`} />
                    <div>
                      <p className="text-xs text-slate-300">{n.msg}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{n.time} ago</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Profile 
          <div className="flex items-center gap-2.5 pl-3 border-l border-white/5 cursor-pointer">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-accent-cyan flex items-center justify-center text-white font-bold text-xs">
              RK
            </div>
            <div className="hidden md:block">
              <div className="text-xs font-medium text-white">Researcher</div>
              <div className="text-[10px] text-slate-500">SLIIT · Admin</div>
            </div>
            <ChevronDown size={13} className="text-slate-500 hidden md:block" />
          </div>*/}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

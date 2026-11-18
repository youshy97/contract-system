import { useState } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard,
  FolderKanban,
  ShoppingCart,
  Warehouse,
  HardHat,
  DollarSign,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Building2,
  Hash,
} from 'lucide-react'

const navItems = [
  { path: '/numbering', icon: Hash, label: 'ترقيم العقود والفواتير' },
  { path: '/', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { path: '/projects', icon: FolderKanban, label: 'المشاريع' },
  { path: '/procurement', icon: ShoppingCart, label: 'المشتريات' },
  { path: '/warehouse', icon: Warehouse, label: 'المخازن' },
  { path: '/execution', icon: HardHat, label: 'التنفيذ' },
  { path: '/finance', icon: DollarSign, label: 'المالية' },
  { path: '/audit', icon: ClipboardList, label: 'سجل التدقيق' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div dir="rtl" className="flex h-screen bg-gray-50">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 border-l border-gray-200 bg-white transition-all duration-200 flex flex-col`}>
        <div className="flex items-center gap-3 border-b border-gray-200 p-4">
          <Building2 className="h-8 w-8 flex-shrink-0 text-primary-600" />
          {sidebarOpen && <div><h1 className="text-sm font-bold text-gray-900">نظام إدارة العقود</h1><p className="text-xs text-gray-500">العقود والفواتير</p></div>}
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
            return <Link key={path} to={path} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Icon className="h-5 w-5 flex-shrink-0" />{sidebarOpen && <span>{label}</span>}
            </Link>
          })}
        </nav>
        <div className="border-t border-gray-200 p-3">
          {sidebarOpen && <div className="mb-2 flex items-center gap-3 px-3 py-2"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100"><span className="text-sm font-medium text-primary-700">{user?.full_name?.charAt(0)}</span></div><div className="min-w-0"><p className="truncate text-sm font-medium text-gray-900">{user?.full_name}</p><p className="text-xs text-gray-500">{user?.role?.replace('_', ' ')}</p></div></div>}
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"><LogOut className="h-5 w-5" />{sidebarOpen && <span>تسجيل الخروج</span>}</button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="إظهار أو إخفاء القائمة" className="rounded-lg p-2 hover:bg-gray-100">{sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          <div className="text-sm text-gray-500">{new Date().toLocaleDateString('ar-IQ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  )
}

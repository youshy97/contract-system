import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import BOQDetail from './pages/BOQDetail'
import Procurement from './pages/Procurement'
import Warehouse from './pages/Warehouse'
import Execution from './pages/Execution'
import Finance from './pages/Finance'
import AuditLog from './pages/AuditLog'
import NumberGenerator from './pages/NumberGenerator'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen" dir="rtl">جارٍ تحميل النظام…</div>
  if (!user) return <Navigate to="/login" />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="numbering" element={<NumberGenerator />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="boq/:id" element={<BOQDetail />} />
        <Route path="procurement" element={<Procurement />} />
        <Route path="warehouse" element={<Warehouse />} />
        <Route path="execution" element={<Execution />} />
        <Route path="finance" element={<Finance />} />
        <Route path="audit" element={<AuditLog />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return <AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>
}

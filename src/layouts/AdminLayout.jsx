import { Outlet } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>
      <BottomNav role="admin" />
    </div>
  )
}

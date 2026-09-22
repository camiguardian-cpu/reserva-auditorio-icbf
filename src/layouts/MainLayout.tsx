import { Outlet } from 'react-router-dom'

import { Navbar } from '../components/Navbar'
import { Sidebar } from '../components/Sidebar'

export const MainLayout = () => (
  <div className="min-h-screen bg-[#f5f7f4] text-[#1D1D1B]">
    <Sidebar />
    <div className="lg:pl-72">
      <Navbar />
      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  </div>
)
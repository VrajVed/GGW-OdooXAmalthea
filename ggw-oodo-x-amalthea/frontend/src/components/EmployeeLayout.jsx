import { Outlet } from 'react-router-dom'
import EmployeeNavbar from './EmployeeNavbar'

function EmployeeLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <EmployeeNavbar />
        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default EmployeeLayout

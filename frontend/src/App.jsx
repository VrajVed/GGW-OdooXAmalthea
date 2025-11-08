import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import EmployeeLayout from './components/EmployeeLayout'
import NotesPage from './pages/NotesPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailsPage from './pages/ProjectDetailsPage'
import TasksPage from './pages/TasksPage'
import NotificationsPage from './pages/NotificationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import LandingPage from './pages/LandingPage'
import ExpensesPage from './pages/ExpensesPage'
import TimesheetsPage from './pages/TimesheetsPage'
import SettingsPage from './pages/SettingsPage'
import SalesOrdersPage from './pages/SalesOrdersPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import CustomerInvoicesPage from './pages/CustomerInvoicesPage'
import VendorBillsPage from './pages/VendorBillsPage'
import CalendarPage from './pages/CalendarPage'

// Employee Pages
import EmployeeDashboardPage from './pages/employee/EmployeeDashboardPage'
import EmployeeNotesPage from './pages/employee/EmployeeNotesPage'
import EmployeeProjectsPage from './pages/employee/EmployeeProjectsPage'
import EmployeeProjectDetailsPage from './pages/employee/EmployeeProjectDetailsPage'
import EmployeeTasksPage from './pages/employee/EmployeeTasksPage'
import EmployeeNotificationsPage from './pages/employee/EmployeeNotificationsPage'
import EmployeeExpensesPage from './pages/employee/EmployeeExpensesPage'
import EmployeeTimesheetsPage from './pages/employee/EmployeeTimesheetsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />

        {/* Project Manager Routes */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/:projectId" element={<ProjectDetailsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="timesheets" element={<TimesheetsPage />} />
          <Route path="emails" element={<div className="p-8"><h1>Emails</h1></div>} />
          <Route path="calendars" element={<CalendarPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="contacts" element={<div className="p-8"><h1>Contacts</h1></div>} />
          <Route path="companies" element={<div className="p-8"><h1>Companies</h1></div>} />
          <Route path="integrations" element={<div className="p-8"><h1>Integrations</h1></div>} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/sales-orders" element={<SalesOrdersPage />} />
          <Route path="settings/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="settings/invoices" element={<CustomerInvoicesPage />} />
          <Route path="settings/vendor-bills" element={<VendorBillsPage />} />
        </Route>

        {/* Employee Routes */}
        <Route path="/employee" element={<EmployeeLayout />}>
          <Route index element={<EmployeeDashboardPage />} />
          <Route path="dashboard" element={<EmployeeDashboardPage />} />
          <Route path="notes" element={<EmployeeNotesPage />} />
          <Route path="projects" element={<EmployeeProjectsPage />} />
          <Route path="projects/:projectId" element={<EmployeeProjectDetailsPage />} />
          <Route path="notifications" element={<EmployeeNotificationsPage />} />
          <Route path="tasks" element={<EmployeeTasksPage />} />
          <Route path="expenses" element={<EmployeeExpensesPage />} />
          <Route path="timesheets" element={<EmployeeTimesheetsPage />} />
          <Route path="emails" element={<div className="p-8"><h1>Emails</h1></div>} />
          <Route path="calendars" element={<div className="p-8"><h1>Calendars</h1></div>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App


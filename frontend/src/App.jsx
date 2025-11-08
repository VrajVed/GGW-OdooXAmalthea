import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />

  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />

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
          <Route path="calendars" element={<div className="p-8"><h1>Calendars</h1></div>} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="contacts" element={<div className="p-8"><h1>Contacts</h1></div>} />
          <Route path="companies" element={<div className="p-8"><h1>Companies</h1></div>} />
          <Route path="integrations" element={<div className="p-8"><h1>Integrations</h1></div>} />
          <Route path="settings" element={<div className="p-8"><h1>Settings</h1></div>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App


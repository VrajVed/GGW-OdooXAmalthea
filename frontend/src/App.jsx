import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import NotesPage from './pages/NotesPage'
import TasksPage from './pages/TasksPage'
import NotificationsPage from './pages/NotificationsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<NotesPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/emails" element={<div className="p-8"><h1>Emails</h1></div>} />
          <Route path="/calendars" element={<div className="p-8"><h1>Calendars</h1></div>} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/contacts" element={<div className="p-8"><h1>Contacts</h1></div>} />
          <Route path="/companies" element={<div className="p-8"><h1>Companies</h1></div>} />
          <Route path="/integrations" element={<div className="p-8"><h1>Integrations</h1></div>} />
          <Route path="/settings" element={<div className="p-8"><h1>Settings</h1></div>} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App


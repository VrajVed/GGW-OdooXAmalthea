import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi } from '../lib/api'
import { 
  Briefcase, 
  AlertTriangle, 
  Clock, 
  TrendingUp,
  Filter,
  Search,
  Calendar,
  Users,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react'

const DashboardPage = () => {
  const navigate = useNavigate()
  
  // State management
  const [dashboardData, setDashboardData] = useState({
    stats: {
      activeProjects: 0,
      delayedTasks: 0,
      hoursLogged: 0,
      revenueEarned: 0
    },
    projects: [],
    filteredProjects: []
  })
  
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  })
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load dashboard data on mount
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Apply filters when they change
  useEffect(() => {
    applyFilters()
  }, [filters, dashboardData.projects])

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [statsRes, projectsRes] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getProjects()
      ])

      if (statsRes.success && projectsRes.success) {
        setDashboardData(prev => ({
          ...prev,
          stats: statsRes.data,
          projects: projectsRes.data,
          filteredProjects: projectsRes.data
        }))
      } else {
        throw new Error('Failed to load dashboard data')
      }
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...dashboardData.projects]

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(p => p.status === filters.status)
    }

    // Filter by search query
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.manager?.name.toLowerCase().includes(query)
      )
    }

    setDashboardData(prev => ({ ...prev, filteredProjects: filtered }))
  }

  const handleFilterChange = (status) => {
    setFilters(prev => ({ ...prev, status }))
  }

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }))
  }

  const handleProjectClick = (projectId) => {
    navigate('/app/projects')
  }

  // KPI configuration
  const kpiMetrics = [
    {
      id: 'active-projects',
      label: 'Active Projects',
      value: dashboardData.stats.activeProjects,
      icon: Briefcase,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Currently in progress'
    },
    {
      id: 'delayed-tasks',
      label: 'Delayed Tasks',
      value: dashboardData.stats.delayedTasks,
      icon: AlertTriangle,
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      description: 'Past due date'
    },
    {
      id: 'hours-logged',
      label: 'Hours Logged',
      value: dashboardData.stats.hoursLogged.toFixed(1),
      icon: Clock,
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Total time tracked'
    },
    {
      id: 'revenue-earned',
      label: 'Revenue Earned',
      value: `₹${dashboardData.stats.revenueEarned.toLocaleString()}`,
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      description: 'Approved expenses'
    }
  ]

  // Filter configuration
  const statusFilters = [
    { id: 'all', label: 'All Projects' },
    { id: 'planned', label: 'Planned' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
    { id: 'on_hold', label: 'On Hold' }
  ]

  const getProjectCount = (status) => {
    if (status === 'all') return dashboardData.projects.length
    return dashboardData.projects.filter(p => p.status === status).length
  }

  const getStatusStyles = (status) => {
    const styles = {
      planned: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
      completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      on_hold: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' }
    }
    return styles[status] || styles.planned
  }

  const getProgressBarColor = (progress) => {
    if (progress >= 75) return 'bg-green-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short' 
    })
  }

  if (isLoading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#714b67] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-[#714b67] text-white rounded-lg hover:bg-[#5a3a52] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="w-full bg-white min-h-full">
        {/* Page Header */}
        <div className="border-b border-gray-200 px-8 py-6 bg-gradient-to-r from-white to-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back! Here's what's happening with your projects today.
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpiMetrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div
                  key={metric.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`${metric.bgColor} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-6 h-6 ${metric.iconColor}`} />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mb-2">{metric.value}</p>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filters Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Status Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-gray-700">
                  <Filter className="w-5 h-5" />
                  <span className="text-sm font-medium">Filter:</span>
                </div>
                {statusFilters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filters.status === filter.id
                        ? 'bg-[#714b67] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label} <span className="ml-1 opacity-75">({getProjectCount(filter.id)})</span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, managers..."
                  value={filters.search}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#714b67] focus:border-transparent w-full lg:w-80 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Projects Grid */}
          {dashboardData.filteredProjects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">
                {filters.search 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by creating your first project'}
              </p>
              <button
                onClick={() => navigate('/app/projects')}
                className="px-6 py-3 bg-[#714b67] text-white rounded-lg hover:bg-[#5a3a52] transition-colors"
              >
                Go to Projects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboardData.filteredProjects.map((project) => {
                const statusStyle = getStatusStyles(project.status)
                
                return (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer group"
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 group-hover:text-[#714b67] transition-colors">
                          {project.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                          {project.statusLabel}
                        </span>
                      </div>
                      {project.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                          {project.description}
                        </p>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-medium text-gray-700">Progress</span>
                        <span className="text-xs font-semibold text-gray-900">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${getProgressBarColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-4 py-3 border-t border-b border-gray-100">
                      <div className="text-center">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 mb-0.5">Tasks</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.tasks.completed}/{project.tasks.total}
                        </p>
                      </div>
                      <div className="text-center">
                        <AlertTriangle className="w-4 h-4 text-red-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 mb-0.5">Delayed</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.tasks.delayed}
                        </p>
                      </div>
                      <div className="text-center">
                        <Calendar className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-gray-600 mb-0.5">Due</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatDate(project.due)}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">
                          {project.manager?.name || 'Unassigned'}
                        </span>
                      </div>
                      {project.budget?.amount && (
                        <span className="text-xs font-semibold text-gray-900">
                          {project.budget.currency} {project.budget.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage


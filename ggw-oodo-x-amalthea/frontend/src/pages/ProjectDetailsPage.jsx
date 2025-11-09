import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Target,
  Activity,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { projectApi, taskApi } from '../lib/api'

export default function ProjectDetailsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (projectId) {
      loadProjectDetails()
    }
  }, [projectId])

  // Refresh project details periodically to get updated financials
  useEffect(() => {
    if (!projectId) return
    
    const interval = setInterval(() => {
      // Refresh project data to get updated financial calculations
      projectApi.getById(projectId).then(res => {
        if (res.success && res.data) {
          setProject(prev => ({
            ...prev,
            ...res.data,
            financials: res.data.financials
          }))
        }
      }).catch(err => {
        console.error('Error refreshing project financials:', err)
      })
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [projectId])

  const loadProjectDetails = async () => {
    try {
      setLoading(true)
      
      const [projectRes, tasksRes] = await Promise.all([
        projectApi.getById(projectId),
        taskApi.getAll(projectId)
      ])

      if (projectRes.success) {
        setProject(projectRes.data)
      }

      if (tasksRes.success) {
        setTasks(tasksRes.data)
      }
    } catch (error) {
      console.error('Error loading project details:', error)
    } finally {
      setLoading(false)
    }
  }

  // Manual refresh function for financials
  const refreshFinancials = async () => {
    try {
      const projectRes = await projectApi.getById(projectId)
      if (projectRes.success && projectRes.data) {
        setProject(prev => ({
          ...prev,
          ...projectRes.data,
          financials: projectRes.data.financials
        }))
      }
    } catch (error) {
      console.error('Error refreshing financials:', error)
    }
  }

  const calculateMetrics = () => {
    if (!project || !tasks) return null

    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.state === 'done').length
    const inProgressTasks = tasks.filter(t => t.state === 'in_progress').length
    const blockedTasks = tasks.filter(t => t.state === 'blocked').length
    const delayedTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.state !== 'done').length

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimate_hours || 0), 0)
    const completedHours = tasks.filter(t => t.state === 'done').reduce((sum, t) => sum + (t.estimate_hours || 0), 0)

    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Financial calculations from API
    const financials = project.financials || {
      budget: project.budget || 0,
      revenue: project.budget || 0,
      totalCosts: 0,
      profit: project.budget || 0,
      costBreakdown: {
        expenses: 0,
        vendorBills: 0,
        employeeWages: 0,
        purchaseOrders: 0
      }
    }

    const budgetAmount = financials.budget || 0
    const revenue = financials.revenue || 0
    const totalCosts = financials.totalCosts || 0
    const profit = financials.profit || 0
    const budgetRemaining = budgetAmount - totalCosts
    const budgetUsagePercent = budgetAmount > 0 ? Math.round((totalCosts / budgetAmount) * 100) : 0
    const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      delayedTasks,
      taskCompletionRate,
      totalEstimatedHours,
      completedHours,
      budgetAmount,
      budgetUsed: totalCosts,
      budgetRemaining,
      budgetUsagePercent,
      revenue,
      totalCosts,
      profit,
      profitMargin,
      costBreakdown: financials.costBreakdown || {
        expenses: 0,
        vendorBills: 0,
        employeeWages: 0,
        purchaseOrders: 0
      }
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'planned': 'bg-blue-100 text-blue-700 border-blue-200',
      'in_progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'New': 'bg-blue-100 text-blue-700 border-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'on_hold': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getTaskStatusColor = (state) => {
    const colors = {
      'todo': 'bg-gray-100 text-gray-700',
      'in_progress': 'bg-blue-100 text-blue-700',
      'done': 'bg-green-100 text-green-700',
      'blocked': 'bg-red-100 text-red-700'
    }
    return colors[state] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'text-gray-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'critical': 'text-red-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  const getRiskLevel = (metrics) => {
    if (!metrics) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' }

    let riskScore = 0

    // Delayed tasks contribute to risk
    if (metrics.delayedTasks > 0) riskScore += 2
    
    // Blocked tasks contribute to risk
    if (metrics.blockedTasks > 0) riskScore += 1

    // Budget overrun contributes to risk
    if (metrics.budgetUsagePercent > 90) riskScore += 2
    else if (metrics.budgetUsagePercent > 75) riskScore += 1

    // Low completion rate contributes to risk
    if (metrics.taskCompletionRate < 30) riskScore += 1

    if (riskScore >= 4) {
      return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' }
    } else if (riskScore >= 2) {
      return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    } else {
      return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' }
    }
  }

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString()}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#714b67] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Project not found</p>
          <button
            onClick={() => navigate('/app/projects')}
            className="mt-4 px-4 py-2 bg-[#714b67] text-white rounded-lg hover:bg-[#5a3a52]"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const metrics = calculateMetrics()
  const risk = getRiskLevel(metrics)

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#714b67] to-[#8a5a7f] text-white sticky top-0 z-10 shadow-md">
        <div className="px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/app/projects')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-white ml-14">
            <span className={`px-3 py-1 rounded-full border ${getStatusColor(project.status)} bg-white`}>
              {project.status}
            </span>
            <span className="flex items-center gap-1 text-white">
              <Calendar className="w-4 h-4" />
              {formatDate(project.start)} - {formatDate(project.due)}
            </span>
            <span className="flex items-center gap-1 text-white">
              <Users className="w-4 h-4" />
              {project.manager?.name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-8 pb-4">
          <div className="flex gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
              { id: 'financials', label: 'Financials', icon: DollarSign }
            ].map(tab => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-2.5 flex items-center gap-2 font-medium transition-all rounded-lg ${
                    activeTab === tab.id
                      ? 'bg-white text-[#714b67] shadow-md'
                      : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Progress & Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Overall Progress */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Target className="w-5 h-5 text-[#714b67]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Overall Progress</h3>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Completion</span>
                    <span className="text-2xl font-bold text-gray-900">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-[#714b67] h-3 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{metrics.completedTasks} of {metrics.totalTasks} tasks completed</p>
              </div>

              {/* Task Success Rate */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-[#714b67]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Task Success Rate</h3>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-2xl font-bold text-gray-900">{metrics.taskCompletionRate}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {metrics.completedTasks > 0 
                    ? `${metrics.completedTasks} out of ${metrics.totalTasks} tasks completed`
                    : 'No tasks completed yet'}
                </p>
              </div>

              {/* Risk Level */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-[#714b67]" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Risk Level</h3>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-bold text-[#714b67]">{risk.level}</span>
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• {metrics.delayedTasks} delayed tasks</li>
                  <li>• {metrics.blockedTasks} blocked tasks</li>
                  <li>• Budget used: {metrics.budgetUsagePercent}%</li>
                </ul>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <DollarSign className="w-5 h-5 text-[#714b67]" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">Financial Overview</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Budget</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.budgetAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Spent</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.budgetUsed)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.budgetRemaining)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.revenue)}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Budget Usage</span>
                  <span className="text-sm font-semibold text-gray-900">{metrics.budgetUsagePercent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-[#714b67] h-2.5 rounded-full"
                    style={{ width: `${Math.min(metrics.budgetUsagePercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Project Description</h3>
                <p className="text-gray-600 leading-relaxed">{project.description}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#714b67]" />
                All Tasks ({tasks.length})
              </h3>
              
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No tasks created yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{task.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTaskStatusColor(task.state)}`}>
                            {task.state?.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {task.assignee_email && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {task.assignee_email}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {formatDate(task.due_date)}
                          </span>
                        )}
                        {task.estimate_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.estimate_hours}h
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
              <button
                onClick={refreshFinancials}
                className="flex items-center gap-2 px-4 py-2 bg-[#714b67] text-white rounded-lg hover:bg-[#5a3a52] transition-colors"
                title="Refresh financial data"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Financials
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Budget Breakdown */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-[#714b67]" />
                  Budget Breakdown
                </h3>
                <div className="space-y-6">
                  {/* Visual Budget Circle */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-48 h-48">
                      <svg className="w-48 h-48 transform -rotate-90">
                        {/* Background circle */}
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="#e5e7eb"
                          strokeWidth="20"
                          fill="none"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="96"
                          cy="96"
                          r="80"
                          stroke="#714b67"
                          strokeWidth="20"
                          fill="none"
                          strokeDasharray={`${(metrics.budgetUsagePercent / 100) * 502.4} 502.4`}
                          className="transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-[#714b67]">{metrics.budgetUsagePercent}%</span>
                        <span className="text-xs text-gray-500 mt-1">Used</span>
                      </div>
                    </div>
                  </div>

                  {/* Budget Stats */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Total Budget</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(metrics.budgetAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Amount Spent</span>
                      <span className="text-lg font-bold text-[#714b67]">{formatCurrency(metrics.budgetUsed)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Remaining</span>
                      <span className="text-lg font-bold text-gray-600">{formatCurrency(metrics.budgetRemaining)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Revenue & Profit */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#714b67]" />
                  Revenue & Profit
                </h3>
                
                {/* Bar Chart Visualization */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Revenue (Budget)</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(metrics.revenue)}</span>
                    </div>
                    <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#714b67] to-[#8a5a7f] flex items-center justify-end pr-3 transition-all duration-1000"
                        style={{ width: '100%' }}
                      >
                        <span className="text-white text-xs font-medium">100%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Costs</span>
                      <span className="text-lg font-bold text-orange-600">{formatCurrency(metrics.totalCosts)}</span>
                    </div>
                    <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 flex items-center justify-end pr-3 transition-all duration-1000"
                        style={{ width: `${metrics.budgetUsagePercent}%` }}
                      >
                        <span className="text-white text-xs font-medium">{metrics.budgetUsagePercent}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Profit</span>
                      <span className={`text-lg font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(metrics.profit)}</span>
                    </div>
                    <div className="h-12 bg-gray-100 rounded-lg overflow-hidden">
                      <div 
                        className={`h-full flex items-center justify-end pr-3 transition-all duration-1000 ${metrics.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(Math.abs(metrics.revenue > 0 ? (metrics.profit / metrics.revenue) * 100 : 0), 100)}%` }}
                      >
                        <span className="text-white text-xs font-medium">{metrics.profitMargin}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Profit Margin</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#714b67]"
                          style={{ width: `${metrics.profitMargin}%` }}
                        />
                      </div>
                      <span className="text-xl font-bold text-[#714b67]">{metrics.profitMargin}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost Analysis */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#714b67]" />
                Cost Analysis
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Project Costs Card */}
                <div className="col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-700">Project Costs vs Budget</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(metrics.totalCosts)}</span>
                  </div>
                  
                  {/* Cost Breakdown */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Expenses</span>
                        <span>{formatCurrency(metrics.costBreakdown?.expenses || 0)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-1000"
                          style={{ width: `${metrics.totalCosts > 0 ? ((metrics.costBreakdown?.expenses || 0) / metrics.totalCosts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Vendor Bills</span>
                        <span>{formatCurrency(metrics.costBreakdown?.vendorBills || 0)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 transition-all duration-1000"
                          style={{ width: `${metrics.totalCosts > 0 ? ((metrics.costBreakdown?.vendorBills || 0) / metrics.totalCosts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Employee Wages</span>
                        <span>{formatCurrency(metrics.costBreakdown?.employeeWages || 0)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-1000"
                          style={{ width: `${metrics.totalCosts > 0 ? ((metrics.costBreakdown?.employeeWages || 0) / metrics.totalCosts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Purchase Orders</span>
                        <span>{formatCurrency(metrics.costBreakdown?.purchaseOrders || 0)}</span>
                      </div>
                      <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                        <div 
                          className="h-full bg-orange-500 transition-all duration-1000"
                          style={{ width: `${metrics.totalCosts > 0 ? ((metrics.costBreakdown?.purchaseOrders || 0) / metrics.totalCosts) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Cards */}
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-xs text-gray-600 mb-1">Cost per Hour</p>
                    <p className="text-2xl font-bold text-[#714b67]">
                      {formatCurrency(metrics.completedHours > 0 ? metrics.totalCosts / metrics.completedHours : 0)}/h
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{metrics.completedHours}h completed</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Profit Margin</p>
                    <p className="text-2xl font-bold text-[#714b67]">
                      {metrics.profitMargin}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Profit / Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { 
  X, 
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
  BarChart3
} from 'lucide-react'
import { projectApi, taskApi } from '../lib/api'

export default function ProjectOverviewModal({ projectId, onClose }) {
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (projectId) {
      loadProjectDetails()
    }
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

    // Budget calculations
    const budgetAmount = project.budget || 0
    const budgetUsed = budgetAmount * (project.progress / 100) || 0
    const budgetRemaining = budgetAmount - budgetUsed

    // Revenue and profit (mock calculations - you can adjust based on your business logic)
    const estimatedRevenue = budgetAmount * 1.3 // 30% markup
    const actualCost = budgetUsed
    const estimatedProfit = estimatedRevenue - budgetAmount
    const currentProfit = estimatedRevenue * (project.progress / 100) - actualCost

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
      budgetUsed,
      budgetRemaining,
      budgetUsagePercent: budgetAmount > 0 ? Math.round((budgetUsed / budgetAmount) * 100) : 0,
      estimatedRevenue,
      actualCost,
      estimatedProfit,
      currentProfit,
      profitMargin: estimatedRevenue > 0 ? Math.round((estimatedProfit / estimatedRevenue) * 100) : 0
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'planned': 'bg-blue-100 text-blue-700 border-blue-200',
      'in_progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'completed': 'bg-green-100 text-green-700 border-green-200',
      'on_hold': 'bg-gray-100 text-gray-700 border-gray-200'
    }
    return colors[project?.status] || colors.planned
  }

  const getRiskLevel = (metrics) => {
    if (!metrics) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' }
    
    const delayedRatio = metrics.totalTasks > 0 ? metrics.delayedTasks / metrics.totalTasks : 0
    const budgetOverrun = metrics.budgetUsagePercent > 100
    const blockedRatio = metrics.totalTasks > 0 ? metrics.blockedTasks / metrics.totalTasks : 0

    if (budgetOverrun || delayedRatio > 0.3 || blockedRatio > 0.2) {
      return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' }
    } else if (delayedRatio > 0.1 || blockedRatio > 0.1 || metrics.budgetUsagePercent > 80) {
      return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
    }
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#714b67] mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const metrics = calculateMetrics()
  const risk = getRiskLevel(metrics)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl my-8 flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b bg-gradient-to-r from-[#714b67] to-[#8a5a7f] text-white rounded-t-lg sticky top-0 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2 text-white">{project.name}</h2>
              <div className="flex items-center gap-4 text-sm text-white">
                <span className={`px-3 py-1 rounded-full border ${getStatusColor(project.status)} bg-white`}>
                  {project.statusLabel || project.status}
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
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-2 bg-white border-b sticky top-[88px] z-10">
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
                  className={`px-4 py-2.5 flex items-center gap-2 font-medium transition-all rounded-lg ${
                    activeTab === tab.id
                      ? 'bg-[#714b67] text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Progress & Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Overall Progress */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Target className="w-5 h-5 text-blue-600" />
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
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {metrics.completedTasks} of {metrics.totalTasks} tasks completed
                  </p>
                </div>

                {/* Task Completion Rate */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900">Task Success Rate</h3>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-2xl font-bold text-gray-900">{metrics.taskCompletionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                        style={{ width: `${metrics.taskCompletionRate}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {metrics.completedHours}h of {metrics.totalEstimatedHours}h estimated
                  </p>
                </div>

                {/* Risk Assessment */}
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 ${risk.bgColor} rounded-lg`}>
                      <AlertTriangle className={`w-5 h-5 ${risk.color}`} />
                    </div>
                    <h3 className="font-semibold text-gray-900">Risk Level</h3>
                  </div>
                  <div className="mb-3">
                    <span className={`text-2xl font-bold ${risk.color}`}>{risk.level}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• {metrics.delayedTasks} delayed tasks</p>
                    <p>• {metrics.blockedTasks} blocked tasks</p>
                    <p>• Budget used: {metrics.budgetUsagePercent}%</p>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Financial Overview
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Budget</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(metrics.budgetAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Spent</p>
                    <p className="text-xl font-bold text-orange-600">{formatCurrency(metrics.budgetUsed)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Remaining</p>
                    <p className="text-xl font-bold text-green-600">{formatCurrency(metrics.budgetRemaining)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Est. Revenue</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(metrics.estimatedRevenue)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Budget Usage</span>
                    <span className="text-sm font-semibold text-gray-900">{metrics.budgetUsagePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        metrics.budgetUsagePercent > 100 ? 'bg-red-500' : 
                        metrics.budgetUsagePercent > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(metrics.budgetUsagePercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Profit Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Profit Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Profit</span>
                      <span className={`text-lg font-bold ${metrics.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(metrics.currentProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Estimated Profit</span>
                      <span className="text-lg font-bold text-gray-900">{formatCurrency(metrics.estimatedProfit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Profit Margin</span>
                      <span className="text-lg font-bold text-purple-600">{metrics.profitMargin}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    Time Tracking
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Estimated</span>
                      <span className="text-lg font-bold text-gray-900">{metrics.totalEstimatedHours}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Completed</span>
                      <span className="text-lg font-bold text-green-600">{metrics.completedHours}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className="text-lg font-bold text-orange-600">{metrics.totalEstimatedHours - metrics.completedHours}h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {project.description && (
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              {/* Task Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm text-center">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalTasks}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm text-center">
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.completedTasks}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm text-center">
                  <p className="text-sm text-gray-600 mb-1">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.inProgressTasks}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm text-center">
                  <p className="text-sm text-gray-600 mb-1">Blocked</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.blockedTasks}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200 shadow-sm text-center">
                  <p className="text-sm text-gray-600 mb-1">Delayed</p>
                  <p className="text-2xl font-bold text-orange-600">{metrics.delayedTasks}</p>
                </div>
              </div>

              {/* Tasks List */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tasks.map(task => (
                        <tr key={task.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{task.title}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.state === 'done' ? 'bg-green-100 text-green-700' :
                              task.state === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                              task.state === 'blocked' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {task.state}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                              task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {task.priority || 'medium'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {task.due_date ? formatDate(task.due_date) : 'Not set'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {task.estimate_hours || 0}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              {/* Budget Breakdown */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  Budget Breakdown
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {formatCurrency(metrics.budgetAmount)}
                    </div>
                    <p className="text-sm text-gray-600">Total Budget</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {formatCurrency(metrics.budgetUsed)}
                    </div>
                    <p className="text-sm text-gray-600">Amount Spent ({metrics.budgetUsagePercent}%)</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(metrics.budgetRemaining)}
                    </div>
                    <p className="text-sm text-gray-600">Remaining Budget</p>
                  </div>
                </div>
              </div>

              {/* Revenue & Profit */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Revenue & Profit Projection
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Revenue</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estimated Revenue</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.estimatedRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Progress</span>
                        <span className="text-sm font-semibold text-blue-600">{project.progress}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Revenue to Date</span>
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(metrics.estimatedRevenue * (project.progress / 100))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Profit</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Estimated Profit</span>
                        <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.estimatedProfit)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Current Profit</span>
                        <span className={`text-sm font-semibold ${metrics.currentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(metrics.currentProfit)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Profit Margin</span>
                        <span className="text-sm font-semibold text-purple-600">{metrics.profitMargin}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Analysis */}
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Cost Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Project Costs</span>
                      <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.actualCost)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${(metrics.actualCost / metrics.budgetAmount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Cost per Hour</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(metrics.completedHours > 0 ? metrics.actualCost / metrics.completedHours : 0)}/h
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Return on Investment</p>
                      <p className="text-lg font-bold text-green-600">
                        {metrics.actualCost > 0 ? Math.round((metrics.currentProfit / metrics.actualCost) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-white rounded-b-lg sticky bottom-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import KanbanColumn from '../../components/KanbanColumn'
import TaskModal from '../../components/TaskModal'
import ProjectTasksDialog from '../../components/ProjectTasksDialog'
import TaskEditDialog from '../../components/TaskEditDialog'
import { projectApi, taskApi, getUser } from '../../lib/api'

function EmployeeTasksPage() {
  const [selectedTask, setSelectedTask] = useState(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  
  // New state for backend data
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState({ new: [], inProgress: [], done: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const pollingIntervalRef = useRef(null)

  const currentUser = getUser()

  // Load data on mount and set up polling
  useEffect(() => {
    loadData()
    
    // Set up polling to refresh tasks every 2 seconds for real-time updates
    // This ensures employees see new tasks immediately after project manager creates them
    pollingIntervalRef.current = setInterval(() => {
      console.log('Polling: Refreshing tasks from database...', new Date().toISOString())
      loadData(false) // Don't show loading spinner during polling
    }, 2000)
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [])

  // Fetch projects and tasks from backend - filter by current user
  const loadData = async (showLoading = true) => {
    try {
      // Check if user is authenticated
      if (!currentUser?.id) {
        console.warn('User not authenticated, skipping data load')
        if (showLoading) {
          setLoading(false)
        }
        return
      }

      if (showLoading) {
        setLoading(true)
      }
      
      // 1. Get only projects where user is a member
      const projectFilters = currentUser?.id ? { user_id: currentUser.id } : {}
      const projectsResponse = await projectApi.getAll(projectFilters)
      if (!projectsResponse.success) {
        throw new Error('Failed to load projects')
      }
      
      const projectsList = projectsResponse.data
      setProjects(projectsList)

      // 2. Get tasks for each project - FILTERED by current user
      const taskFilters = currentUser?.id ? { user_id: currentUser.id } : {}
      
      console.log('Loading tasks for employee (fresh from DB):', {
        userId: currentUser?.id,
        projectCount: projectsList.length,
        timestamp: new Date().toISOString()
      })
      
      const tasksPromises = projectsList.map(project => 
        taskApi.getAll(project.id, taskFilters)
      )
      const tasksResponses = await Promise.all(tasksPromises)
      
      // Log task counts for debugging
      let totalTasks = 0
      tasksResponses.forEach((response, index) => {
        if (response.success) {
          const taskCount = response.data?.length || 0
          totalTasks += taskCount
          console.log(`Project ${projectsList[index].name}: ${taskCount} tasks assigned to employee`)
        }
      })
      console.log(`Total tasks loaded: ${totalTasks}`)

      // 3. Organize tasks by state - Group by project
      const organized = { new: [], inProgress: [], done: [] }
      
      projectsList.forEach((project, index) => {
        const tasksResponse = tasksResponses[index]
        const projectTasks = tasksResponse.success ? tasksResponse.data : []

        // Tasks are already filtered by backend for this user
        if (projectTasks.length === 0) {
          return // Skip projects with no tasks for this user
        }

        // Group tasks by their state
        const tasksByState = {
          new: [],
          inProgress: [],
          done: []
        }

        projectTasks.forEach(task => {
          const taskData = {
            id: task.id,
            title: task.title,
            description: task.description,
            deadline: task.due_date,
            tags: task.labels || [],
            assignee: currentUser?.name || "User",
            created: task.created_at,
            state: task.state,
            priority: task.priority,
            timesheets: [],
            changeHistory: []
          }

          // Add task to appropriate state group
          if (task.state === 'new') {
            tasksByState.new.push(taskData)
          } else if (task.state === 'in_progress' || task.state === 'blocked') {
            tasksByState.inProgress.push(taskData)
          } else if (task.state === 'done') {
            tasksByState.done.push(taskData)
          }
        })

        // Create project cards for each state that has tasks
        Object.keys(tasksByState).forEach(state => {
          if (tasksByState[state].length > 0) {
            const allLabels = [...new Set(tasksByState[state].flatMap(t => t.tags || []))]
            
            const dates = tasksByState[state]
              .map(t => t.deadline)
              .filter(d => d)
              .map(d => new Date(d))
            
            const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : null
            const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : null
            
            const dateRange = minDate && maxDate 
              ? `${minDate.toLocaleDateString()} • ${maxDate.toLocaleDateString()}`
              : ''

            const projectCard = {
              id: `${project.id}-${state}`,
              title: project.name,
              description: project.description,
              project: project.name,
              badges: allLabels,
              dueDate: dateRange,
              tasks: tasksByState[state].length,
              assignedUsers: [{ name: currentUser?.name || "User", initials: currentUser?.name?.charAt(0) || "U" }],
              taskList: tasksByState[state],
              projectId: project.id,
              projectData: project
            }

            organized[state].push(projectCard)
          }
        })
      })

      setAllTasks(organized)
      setError(null)
      if (showLoading) {
        setLoading(false)
      }
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  // When clicking on a task card, open the project details dialog
  const handleTaskClick = (task) => {
    setSelectedProject(task)
    setIsProjectDialogOpen(true)
  }

  const handleCloseProjectDialog = () => {
    setIsProjectDialogOpen(false)
    setSelectedProject(null)
  }

  return (
    <div className="h-full bg-gray-50">
      <ProjectTasksDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={handleCloseProjectDialog}
        readOnly={true}
      />

      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-600 mt-1">Tasks assigned to you</p>
          </div>
        </div>
      </header>

      <div className="p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-500">Error: {error}</p>
          </div>
        ) : (
          <div className="flex gap-6 overflow-x-auto pb-4">
            <KanbanColumn
              title="New"
              count={allTasks.new.length}
              tasks={allTasks.new}
              onTaskClick={handleTaskClick}
            />
            <KanbanColumn
              title="In Progress"
              count={allTasks.inProgress.length}
              tasks={allTasks.inProgress}
              onTaskClick={handleTaskClick}
            />
            <KanbanColumn
              title="Completed"
              count={allTasks.done.length}
              tasks={allTasks.done}
              isCompleted={true}
              onTaskClick={handleTaskClick}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeTasksPage

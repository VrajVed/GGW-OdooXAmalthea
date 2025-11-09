import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import KanbanColumn from '../components/KanbanColumn'
import TaskModal from '../components/TaskModal'
import ProjectTasksDialog from '../components/ProjectTasksDialog'
import TaskEditDialog from '../components/TaskEditDialog'
import { projectApi, taskApi } from '../lib/api'

const tasksData = {
  new: [
    {
      id: 1,
      title: "Website Redesign",
      description: "Complete redesign of company website with modern UI/UX",
      project: "RD Sales",
      badges: ["Design", "Frontend"],
      dueDate: "2025-11-07 • 2025-12-07",
      tasks: 0,
      assignedUsers: [
        { name: "Alex User", initials: "AU" },
      ],
      taskList: [
        { 
          id: 101, 
          title: "Design Homepage", 
          description: "Create wireframes and mockups for the homepage",
          deadline: "2025-11-15T10:00",
          tags: ["Design", "UI"],
          assignee: "Alex User",
          created: "2025-11-08T09:00:00",
          timesheets: [],
          changeHistory: []
        },
        { 
          id: 102, 
          title: "Implement Navigation", 
          description: "Code the responsive navigation menu",
          deadline: "2025-11-18T15:00",
          tags: ["Frontend", "React"],
          assignee: "Alex User",
          created: "2025-11-08T09:30:00",
          timesheets: [],
          changeHistory: []
        },
      ],
    },
  ],
  inProgress: [
    {
      id: 2,
      title: "weq",
      description: "sas",
      project: "Internal Project",
      badges: ["Development"],
      dueDate: "2025-11-27 • 2025-12-03",
      tasks: 0,
      assignedUsers: [
        { name: "Unknown User", initials: "U" },
      ],
      taskList: [
        { 
          id: 201, 
          title: "Setup Environment", 
          description: "Configure development environment",
          deadline: "2025-11-20T12:00",
          tags: ["Setup"],
          assignee: "Unknown User",
          created: "2025-11-08T10:00:00",
          timesheets: [],
          changeHistory: []
        },
      ],
    },
    {
      id: 3,
      title: "Mobile App Development",
      description: "Develop cross-platform mobile application for customer engagement",
      project: "Mobile Division",
      badges: ["Mobile", "React Native"],
      dueDate: "2025-10-23 • 2025-12-22",
      tasks: 0,
      assignedUsers: [
        { name: "Alex User", initials: "AU" },
      ],
      taskList: [
        { 
          id: 301, 
          title: "Setup React Native", 
          description: "Initialize React Native project",
          deadline: "2025-11-10T14:00",
          tags: ["Mobile", "Setup"],
          assignee: "Alex User",
          created: "2025-11-08T08:00:00",
          timesheets: [],
          changeHistory: []
        },
        { 
          id: 302, 
          title: "Build Login Screen", 
          description: "Create authentication UI",
          deadline: "2025-11-25T16:00",
          tags: ["Mobile", "UI"],
          assignee: "Alex User",
          created: "2025-11-08T08:30:00",
          timesheets: [],
          changeHistory: []
        },
      ],
    },
  ],
  done: [
    {
      id: 4,
      title: "Security Audit",
      description: "Comprehensive security audit and penetration testing",
      project: "Security Team",
      badges: ["Security", "Testing"],
      dueDate: "2025-09-08 • 2025-11-02",
      tasks: 0,
      assignedUsers: [
        { name: "Alex User", initials: "AU" },
      ],
      taskList: [
        { 
          id: 401, 
          title: "Vulnerability Scan", 
          description: "Run automated security scans",
          deadline: "2025-10-15T12:00",
          tags: ["Security"],
          assignee: "Alex User",
          created: "2025-10-01T09:00:00",
          timesheets: [],
          changeHistory: []
        },
      ],
    },
  ],
}

function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState('kanban')
  const [selectedTask, setSelectedTask] = useState(null)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isTaskEditDialogOpen, setIsTaskEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  
  // New state for backend data
  const [projects, setProjects] = useState([])
  const [allTasks, setAllTasks] = useState({ new: [], inProgress: [], done: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load data on mount
  useEffect(() => {
    loadData()
  }, [])

  // Fetch projects and tasks from backend
  const loadData = async () => {
    try {
      setLoading(true)
      
      // 1. Get all projects
      const projectsResponse = await projectApi.getAll()
      if (!projectsResponse.success) {
        throw new Error('Failed to load projects')
      }
      
      const projectsList = projectsResponse.data
      setProjects(projectsList)

      // 2. Get tasks for each project
      const tasksPromises = projectsList.map(project => 
        taskApi.getAll(project.id)
      )
      const tasksResponses = await Promise.all(tasksPromises)

      // 3. Organize tasks by state - Group by project
      const organized = { new: [], inProgress: [], done: [] }
      
      // Create a map to track projects by state
      const projectsByState = {
        new: new Map(),
        inProgress: new Map(),
        done: new Map()
      }
      
      projectsList.forEach((project, index) => {
        const tasksResponse = tasksResponses[index]
        const projectTasks = tasksResponse.success ? tasksResponse.data : []

        // Group tasks by their state
        const tasksByState = {
          new: [],
          inProgress: [],
          done: []
        }

        projectTasks.forEach(task => {
          const taskData = {
            id: task.id, // This is the UUID from database
            title: task.title,
            description: task.description,
            deadline: task.due_date,
            tags: task.labels || [],
            assignee: "User",
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
            // Get all unique labels from tasks
            const allLabels = [...new Set(tasksByState[state].flatMap(t => t.tags || []))]
            
            // Get earliest and latest dates
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
              id: `${project.id}-${state}`, // Unique ID for each project-state combination
              title: project.name,
              description: project.description,
              project: project.name,
              badges: allLabels,
              dueDate: dateRange,
              tasks: tasksByState[state].length,
              assignedUsers: [{ name: "User", initials: "U" }],
              taskList: tasksByState[state],
              projectId: project.id,
              projectData: project
            }

            organized[state].push(projectCard)
          }
        })
      })

      setAllTasks(organized)
      setLoading(false)
      
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // When clicking on a task card, open the project details dialog
  const handleTaskClick = (task) => {
    setSelectedProject(task)
    setIsProjectDialogOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTask(null)
  }

  const handleCloseProjectDialog = () => {
    setIsProjectDialogOpen(false)
    setSelectedProject(null)
  }

  const handleAddTask = (project) => {
    // Create a new empty task for this project
    const newTask = {
      id: Date.now(),
      title: 'New Task',
      description: '',
      deadline: '',
      tags: [],
      assignee: '',
      created: new Date().toISOString(),
      timesheets: [],
      changeHistory: [{
        description: 'Task created',
        timestamp: new Date().toISOString(),
        user: 'Current User'
      }],
    }
    setEditingTask(newTask)
    setSelectedProject(project)
    setIsTaskEditDialogOpen(true)
  }

  const handleEditTask = (task, project) => {
    setEditingTask(task)
    setSelectedProject(project)
    setIsTaskEditDialogOpen(true)
  }

  const handleSaveTask = async (updatedTask) => {
    try {
      const projectId = selectedProject?.projectId || selectedProject?.id || projects[0]?.id
      
      if (!projectId) {
        alert('No project selected')
        return
      }

      // Validate title
      if (!updatedTask.title || updatedTask.title.trim().length === 0) {
        alert('Task title is required')
        return
      }

      // Prepare task data - use the state and priority from the form
      const taskData = {
        title: updatedTask.title.trim(),
        description: updatedTask.description || '',
        state: updatedTask.state || 'new',
        priority: updatedTask.priority || 'medium',
        due_date: updatedTask.deadline || null,
        labels: updatedTask.tags || [],
        // Send assignee_id - use the assignee_id from formData (which comes from TaskEditDialog)
        // Only use updatedTask.assignee_id if formData doesn't have one
        assignee_id: updatedTask.assignee_id || null,
      }
      
      console.log('Task data being sent:', {
        ...taskData,
        assignee_id: taskData.assignee_id,
        original_assignee: updatedTask.assignee,
        original_assignee_id: updatedTask.assignee_id
      })

      // Check if updating (UUID format: has dashes and is 36 chars) or creating (numeric timestamp)
      const taskIdStr = String(updatedTask.id)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(taskIdStr)
      
      console.log('Saving task:', { 
        taskId: updatedTask.id, 
        taskIdStr, 
        isUUID, 
        projectId,
        taskData 
      })
      
      let response
      if (isUUID) {
        // Update existing task
        console.log('Updating existing task:', updatedTask.id)
        response = await taskApi.update(projectId, updatedTask.id, taskData)
      } else {
        // Create new task
        console.log('Creating new task')
        response = await taskApi.create(projectId, taskData)
      }

      if (response.success) {
        console.log('Task saved successfully:', response.data)
        await loadData() // Reload to show changes
        setIsTaskEditDialogOpen(false)
        setEditingTask(null)
      } else {
        alert('Failed to save task: ' + response.message)
      }
    } catch (err) {
      console.error('Error saving task:', err)
      alert('Error saving task: ' + err.message)
    }
  }

  const handleCloseTaskEditDialog = () => {
    setIsTaskEditDialogOpen(false)
    setEditingTask(null)
  }

  const handleDeleteTask = async (taskId, projectId) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return
    }

    try {
      const response = await taskApi.delete(projectId, taskId)
      if (response.success) {
        await loadData() // Reload to show changes
      } else {
        alert('Failed to delete task: ' + response.message)
      }
    } catch (err) {
      console.error('Error deleting task:', err)
      alert('Error deleting task: ' + err.message)
    }
  }

  const handleNewTask = () => {
    // Create a new empty task (not tied to a specific project initially)
    const newTask = {
      id: Date.now(), // Temporary numeric ID
      title: '',
      description: '',
      deadline: '',
      tags: [],
      assignee: '',
      created: new Date().toISOString(),
      timesheets: [],
      changeHistory: [{
        description: 'Task created',
        timestamp: new Date().toISOString(),
        user: 'Current User'
      }],
    }
    setEditingTask(newTask)
    setSelectedProject({ project: 'New Task', title: 'New Task' }) // Default project info
    setIsTaskEditDialogOpen(true)
  }

  return (
    <div className="h-full bg-gray-50">
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        task={selectedTask}
      />
      
      <ProjectTasksDialog
        project={selectedProject}
        isOpen={isProjectDialogOpen}
        onClose={handleCloseProjectDialog}
        onAddTask={handleAddTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />

      <TaskEditDialog
        task={editingTask}
        project={selectedProject}
        isOpen={isTaskEditDialogOpen}
        onClose={handleCloseTaskEditDialog}
        onSave={handleSaveTask}
      />

      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-gray-900">Tasks View</h1>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleNewTask}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity" 
              style={{ backgroundColor: '#714b67' }}
            >
              <Plus className="w-4 h-4" />
              New
            </button>
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

export default TasksPage


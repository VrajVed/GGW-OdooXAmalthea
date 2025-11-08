import { useState } from 'react'
import { Plus } from 'lucide-react'
import KanbanColumn from '../components/KanbanColumn'
import TaskModal from '../components/TaskModal'
import ProjectTasksDialog from '../components/ProjectTasksDialog'
import TaskEditDialog from '../components/TaskEditDialog'

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

  const allTasks = {
    new: tasksData.new,
    inProgress: tasksData.inProgress,
    done: tasksData.done,
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

  const handleSaveTask = (updatedTask) => {
    console.log('Saving task:', updatedTask)
    // Here you would update the task in your data structure
    // For now, we'll just close the dialog
    setIsTaskEditDialogOpen(false)
    setEditingTask(null)
  }

  const handleCloseTaskEditDialog = () => {
    setIsTaskEditDialogOpen(false)
    setEditingTask(null)
  }

  const handleNewTask = () => {
    // Create a new empty task (not tied to a specific project initially)
    const newTask = {
      id: Date.now(),
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
        <div className="flex gap-6 overflow-x-auto pb-4">
          <KanbanColumn
            title="New"
            count={tasksData.new.length}
            tasks={tasksData.new}
            onTaskClick={handleTaskClick}
          />
          <KanbanColumn
            title="In Progress"
            count={tasksData.inProgress.length}
            tasks={tasksData.inProgress}
            onTaskClick={handleTaskClick}
          />
          <KanbanColumn
            title="Completed"
            count={tasksData.done.length}
            tasks={tasksData.done}
            isCompleted={true}
            onTaskClick={handleTaskClick}
          />
        </div>
      </div>
    </div>
  )
}

export default TasksPage


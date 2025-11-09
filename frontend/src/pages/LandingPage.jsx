import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle, Clock, Users, BarChart3, Calendar, Shield } from 'lucide-react'
import logo from '../images/logo.png'
import { Tiles } from '../components/ui/tiles'

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Seamlessly manage projects with your team members and track everyone's progress in real-time."
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Time Tracking",
      description: "Built-in timesheet management to monitor hours spent on tasks and optimize productivity."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Financial Insights",
      description: "Track expenses, generate invoices, and manage purchase orders all in one place."
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Task Management",
      description: "Create, assign, and prioritize tasks with deadlines. Never miss important deliverables."
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "Project Visibility",
      description: "Get complete oversight of project status, progress, and team performance with detailed dashboards."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Role-Based Access",
      description: "Secure authentication with role-based permissions for managers, team members, and finance staff."
    }
  ]

  const stats = [
    { value: "100%", label: "Project Visibility" },
    { value: "Real-time", label: "Task Updates" },
    { value: "Multi-role", label: "Access Control" },
    { value: "24/7", label: "System Access" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 relative">
      {/* Animated Tiles Background - Behind everything */}
      <div className="fixed inset-0 w-full h-full opacity-20 pointer-events-none z-0">
        <Tiles rows={100} cols={25} tileSize="md" />
      </div>

      {/* All content above background */}
      <div className="relative z-10">

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-24">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Streamline Your Workflow
            <span className="block mt-2" style={{ color: '#714b67' }}>With OneFlow</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            A unified platform for project management, time tracking, expense monitoring, and team collaboration. 
            Built for managers and teams who value efficiency.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate('/signup')}
              className="px-8 py-4 text-base font-semibold text-white rounded-lg hover:opacity-90 transition-all transform hover:scale-105 shadow-lg flex items-center gap-2"
              style={{ backgroundColor: '#714b67' }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 text-base font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400 transition-all"
            >
              Login to Account
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold mb-2" style={{ color: '#714b67' }}>
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Projects
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              OneFlow brings together all the essential tools your team needs to plan, execute, and deliver projects on time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl border border-gray-200 hover:border-purple-200 hover:shadow-lg transition-all bg-white group"
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform" style={{ backgroundColor: '#f3e8ff', color: '#714b67' }}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple Yet Powerful
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              OneFlow adapts to your workflow, whether you're a project manager overseeing multiple teams or a team member tracking your daily tasks.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold" style={{ backgroundColor: '#714b67' }}>
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Create Your Projects
              </h3>
              <p className="text-gray-600">
                Set up projects with clear goals, deadlines, and budgets. Organize tasks into manageable lists.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold" style={{ backgroundColor: '#714b67' }}>
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Assign & Collaborate
              </h3>
              <p className="text-gray-600">
                Assign tasks to team members, track progress, and collaborate in real-time with status updates.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold" style={{ backgroundColor: '#714b67' }}>
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Track & Deliver
              </h3>
              <p className="text-gray-600">
                Monitor time, expenses, and milestones. Get insights from dashboards and deliver projects successfully.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="rounded-2xl p-12 shadow-xl" style={{ backgroundColor: '#714b67' }}>
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join teams already using OneFlow to manage projects efficiently and deliver exceptional results.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate('/signup')}
                className="px-8 py-4 text-base font-semibold bg-white rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-lg"
                style={{ color: '#714b67' }}
              >
                Get Started Now
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-4 text-base font-semibold text-white bg-transparent border-2 border-white rounded-lg hover:bg-white/10 transition-all"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Copyright */}
      <div className="py-8 text-center">
        <p className="text-sm text-black font-medium">Copyright © 2025 - Made by team GitGoneWild</p>
      </div>
      
      </div>
    </div>
  )
}

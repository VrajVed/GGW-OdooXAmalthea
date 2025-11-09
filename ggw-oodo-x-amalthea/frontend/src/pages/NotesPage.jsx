import { Search, ChevronDown } from 'lucide-react'
import NoteCard from '../components/NoteCard'

const notesData = [
  {
    id: 1,
    title: "Product Team Meeting",
    description: "This monthly progress agenda is following this items: Introduction to Newest Product Plan, Monthly Revenue updates for each.",
    badges: ["Weekly", "Product"],
    user: { name: "Floyd Miles", avatar: "FM" },
    date: "Mar 5 04:25",
    image: null,
  },
  {
    id: 2,
    title: "Product Team Meeting",
    description: "This monthly progress agenda is following this items: Introduction to Newest Product Plan, Monthly Revenue updates for each.",
    badges: ["Monthly", "Business"],
    user: { name: "Dianne Russell", avatar: "DR" },
    date: "Apr 11 18:30",
    image: null,
  },
  {
    id: 3,
    title: "HR Interview",
    description: "This monthly progress agenda is following this items: Introduction to Newest Product Plan, Monthly Revenue updates for each.",
    badges: ["Personal", "Business"],
    user: { name: "Annette Black", avatar: "AB" },
    date: "Jun 23 14:31",
    image: null,
  },
  {
    id: 4,
    title: "Monthly Team Progress",
    description: "This monthly progress agenda is following this items: Introduction to Newest Product Plan, Monthly Revenue updates for each.",
    badges: ["Monthly", "Product"],
    user: { name: "Robert Fox", avatar: "RF" },
    date: "Jan 31 09:53",
    image: null,
  },
  {
    id: 5,
    title: "Product Team Meeting",
    description: "Some Summaries of this weeks meeting with some conclusion we get: Some of our product uploaded improved",
    badges: ["Monthly", "Business"],
    user: { name: "Brooklyn Simmons", avatar: "BS" },
    date: "Aug 15 10:29",
    image: null,
  },
  {
    id: 6,
    title: "Document Images",
    description: "Report Document of Weekly Meetings.",
    badges: ["Personal"],
    user: { name: "Cameron Williamson", avatar: "CW" },
    date: "Dec 30 21:28",
    image: "document",
  },
  {
    id: 7,
    title: "Weekly Team Progress",
    description: "This weekly progress agenda is following this items: Introduction to Newest Product Plan, Monthly Revenue updates for each.",
    badges: ["Weekly", "Product"],
    user: { name: "Dianne Russell", avatar: "DR" },
    date: "Feb 4 19:08",
    image: null,
  },
  {
    id: 8,
    title: "Revenue Progress",
    description: "",
    badges: ["Business"],
    user: { name: "Ronald Richards", avatar: "RR" },
    date: "May 22 04:43",
    image: "chart",
  },
  {
    id: 9,
    title: "Monthly Products",
    description: "Report Document of Weekly Meetings.",
    badges: ["Product"],
    user: { name: "Albert Flores", avatar: "AF" },
    date: "Oct 4 15:49",
    image: "products",
  },
]

function NotesPage() {
  return (
    <div className="h-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6 flex-1">
            <h1 className="text-2xl font-semibold text-gray-900">Notes</h1>
            
            
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Q Search"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
              />
            </div>

            <a href="#" className="text-sm text-gray-600 hover:text-gray-900">
              Help Center
            </a>
          </div>

          <div className="flex items-center gap-4">
            
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-3 py-2">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">BF</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Brian F.</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>

            <button 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
              style={{ border: '1.5px solid #714b67' }}
            >
              Sort By
            </button>
            <button 
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white rounded-lg hover:bg-gray-50"
              style={{ border: '1.5px solid #714b67' }}
            >
              Filter
            </button>
            <button className="px-4 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity" style={{ backgroundColor: '#714b67' }}>
              + Add Notes
            </button>
          </div>
        </div>
      </header>

  <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {notesData.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default NotesPage


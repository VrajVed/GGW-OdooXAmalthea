import Navbar from './Navbar'

function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen bg-white">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

export default Layout


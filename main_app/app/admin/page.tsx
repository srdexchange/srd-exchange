import AdminLeftSide from '../../components/admin_left_side'
import AdminCenter from '../../components/admin_center'
import AdminRight from '../../components/admin_right'

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-black">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-screen px-4 pl-0 pr-0">
        {/* Left Sidebar */}
        <div className="lg:col-span-3 bg-black rounded-lg overflow-y-auto">
          <AdminLeftSide />
        </div>
        
        {/* Center Content  */}
        <div className="lg:col-span-5 bg-black rounded-lg overflow-y-auto">
          <AdminCenter />
        </div>
        
        {/* Right Sidebar  */}
        <div className="lg:col-span-4 rounded-lg overflow-y-auto">
          <AdminRight />
        </div>
      </div>
    </div>
  )
}
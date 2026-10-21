import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout(){
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex">
      <Sidebar/>
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar/>
        <main className="p-6 lg:p-8 bg-[var(--background)]">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}

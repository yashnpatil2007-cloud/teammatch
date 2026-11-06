import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardLayout(){
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)] flex">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onToggleMobileMenu={() => setMobileOpen(prev => !prev)} />
        <main className="p-4 sm:p-6 lg:p-8 bg-[var(--background)]">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}

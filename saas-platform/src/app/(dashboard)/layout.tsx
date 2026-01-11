import React from 'react';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full relative bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80]">
        <Sidebar />
      </div>

      <main className="md:pl-72 h-full min-h-screen relative flex flex-col z-10">
        <Header />
        <div className="flex-1 px-4 md:px-8 pb-8 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
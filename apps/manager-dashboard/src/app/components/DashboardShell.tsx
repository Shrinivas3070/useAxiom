'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Sparkles,
  Search,
  Plus,
  Menu,
  X,
  Bell,
} from 'lucide-react';
import { Button } from '@useaxiom/ui';
import AIAssistantPanel from './AIAssistantPanel';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Team Workload', href: '/team', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r-4 border-gray-900 bg-white shrink-0 sticky top-0 h-screen">
        <div className="p-6 flex items-center gap-3 border-b-4 border-gray-900 bg-white">
          <div className="w-10 h-10 bg-blue-600 flex items-center justify-center rounded-none shadow-none">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-gray-900 tracking-tight">useAxiom</span>
            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">
              Manager Port
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all duration-200 group border-4 ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-900 border-transparent hover:border-gray-900 hover:bg-gray-100'
                }`}
              >
                <item.icon
                  className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-gray-900'}`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t-4 border-gray-900 bg-gray-50 flex items-center gap-3">
          <div className="w-12 h-12 bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
            DM
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-bold text-gray-900 truncate">David Miller</span>
            <span className="block text-xs font-semibold text-gray-600 truncate">
              Project Lead @ Org A
            </span>
          </div>
        </div>
      </aside>

      {/* Sidebar - Mobile drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-none"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 w-72 h-full bg-white border-r-4 border-gray-900 flex flex-col p-6 animate-in slide-in-from-left duration-200 shadow-none">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-gray-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-gray-900">useAxiom</span>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-2">
              {navigation.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all border-4 ${
                      isActive
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-900 border-transparent hover:border-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t-4 border-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 flex items-center justify-center text-white font-bold">
                DM
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold truncate">David Miller</span>
                <span className="block text-xs font-semibold text-gray-600 truncate">
                  Project Lead
                </span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 h-20 border-b-4 border-gray-900 bg-white flex items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-900 md:hidden transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2.5 bg-gray-100 border-4 border-transparent px-4 py-2.5 w-80 focus-within:border-gray-900 transition-all duration-200">
              <Search className="w-5 h-5 text-gray-900" />
              <input
                type="text"
                placeholder="Search projects, tasks..."
                className="bg-transparent text-sm font-bold text-gray-900 placeholder-gray-500 outline-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI Assistant Trigger */}
            <button
              onClick={() => setIsAIOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 hover:scale-105 text-white font-bold transition-all duration-200 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Axiom</span>
            </button>

            {/* Notification Bell */}
            <button className="p-2 bg-gray-100 border-4 border-transparent hover:border-gray-900 text-gray-900 transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
            </button>

            <Link href="/projects">
              <Button
                variant="primary"
                size="sm"
                className="hidden sm:inline-flex shadow-none border-0 h-11 px-5"
              >
                <Plus className="w-4 h-4" />
                <span>New Project</span>
              </Button>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Container */}
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Global AI Assistant Slideout */}
      <AIAssistantPanel isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}

import React from 'react';
import { LayoutDashboard, Users, BookOpen, GraduationCap, DollarSign, Calendar, MessageSquare, Menu, ChevronLeft, UserCircle, UserCog, Library } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  role: Role;
  currentView: string;
  onChangeView: (view: string) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, currentView, onChangeView, isOpen, toggleSidebar }) => {
  const isStudent = role === 'STUDENT';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { id: 'profile', label: 'My Profile', icon: <UserCircle size={20} />, roles: ['STUDENT', 'PARENT'] },
    { id: 'users', label: 'User Management', icon: <UserCog size={20} />, roles: ['ADMIN'] },
    { id: 'my-classes', label: role === 'PARENT' ? "Child's Classes" : 'My Classes', icon: <Library size={20} />, roles: ['TEACHER', 'STUDENT', 'PARENT'] },
    { id: 'students', label: role === 'PARENT' ? 'My Children' : 'Students', icon: <Users size={20} />, roles: ['ADMIN', 'TEACHER', 'PARENT'] },
    { id: 'teachers', label: 'Teachers', icon: <BookOpen size={20} />, roles: ['ADMIN'] },
    { id: 'attendance', label: isStudent ? 'My Attendance' : role === 'PARENT' ? 'Child Attendance' : 'Attendance', icon: <Calendar size={20} />, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { id: 'exams', label: isStudent ? 'My Grades' : role === 'PARENT' ? 'Child Grades' : 'Exams & Grades', icon: <GraduationCap size={20} />, roles: ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { id: 'fees', label: isStudent ? 'My Payments' : role === 'PARENT' ? 'Child Fees' : 'Fees', icon: <DollarSign size={20} />, roles: ['ADMIN', 'PARENT', 'STUDENT'] },
    { id: 'ai-assistant', label: 'AI Assistant', icon: <MessageSquare size={20} />, roles: ['ADMIN', 'TEACHER'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30 w-72 bg-slate-900 text-white transform transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl lg:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col border-r border-slate-800
      `}>
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/30">
              <GraduationCap className="text-white" size={24} />
            </div>
            <div>
              <span className="block text-lg font-bold tracking-tight text-white">EduSphere</span>
              <span className="block text-xs text-slate-400 font-medium tracking-wide">MANAGEMENT</span>
            </div>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Main Menu
          </div>
          {filteredItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={`
                  group flex items-center w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 ease-in-out relative overflow-hidden
                  ${isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 rounded-r-full"></div>
                )}
                <span className={`mr-3 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 m-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg
              ${role === 'ADMIN' ? 'bg-gradient-to-br from-purple-500 to-indigo-600' :
                role === 'TEACHER' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                role === 'STUDENT' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
                'bg-gradient-to-br from-orange-500 to-amber-600'
              }
            `}>
              {role.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">Current User</p>
              <p className="text-xs text-slate-400 capitalize truncate">{role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
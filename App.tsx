import React, { useState, useEffect, useRef } from 'react';
import { User } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import TeacherList from './components/TeacherList';
import Attendance from './components/Attendance';
import Exams from './components/Exams';
import Fees from './components/Fees';
import AIAssistant from './components/AIAssistant';
import Login from './components/Login';
import Profile from './components/Profile';
import UserManagement from './components/UserManagement';
import MyClasses from './components/MyClasses';
import Notifications, { NotificationItem } from './components/Notifications';
import { Bell, Search, LogOut, Menu, Loader2, Command, X, ChevronRight, LayoutDashboard, Users, BookOpen, DollarSign, GraduationCap, Sun, Moon, Monitor } from 'lucide-react';
import { api } from './services/api';
import { MOCK_STUDENTS } from './services/mockData';

// Mock Search Data
const SEARCH_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', type: 'PAGE', icon: LayoutDashboard },
  { id: 'students', label: 'Student Directory', type: 'PAGE', icon: Users },
  { id: 'teachers', label: 'Teacher Directory', type: 'PAGE', icon: BookOpen },
  { id: 'fees', label: 'Fee Management', type: 'PAGE', icon: DollarSign },
  { id: 'exams', label: 'Exams & Grades', type: 'PAGE', icon: GraduationCap },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'New Student Registration', message: 'Emma Thompson has been registered to Class 10-A.', time: '2 mins ago', type: 'INFO', read: false },
  { id: '2', title: 'System Maintenance', message: 'Scheduled maintenance tonight at 11:00 PM.', time: '1 hour ago', type: 'WARNING', read: false },
  { id: '3', title: 'Payment Received', message: 'Tuition fees received from 15 students today.', time: '3 hours ago', type: 'SUCCESS', read: true },
  { id: '4', title: 'High Absenteeism Alert', message: 'Class 9-B reported 20% absenteeism today.', time: '5 hours ago', type: 'ALERT', read: false },
];

type ThemeMode = 'light' | 'dark' | 'system';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme State
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode') as ThemeMode;
    return saved || 'system';
  });

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notification State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Theme Logic
  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      let isDark = false;

      if (themeMode === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = themeMode === 'dark';
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    localStorage.setItem('theme-mode', themeMode);

    // If on system mode, listen for changes
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await api.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.log("No active session");
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();

    // Keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    
    // Filter Pages
    const pages = SEARCH_ITEMS.filter(item => item.label.toLowerCase().includes(query));
    
    // Filter Students (Mock)
    const students = MOCK_STUDENTS.filter(s => s.name.toLowerCase().includes(query)).map(s => ({
      id: s.id,
      label: s.name,
      type: 'STUDENT',
      detail: `Class ${s.grade}-${s.section}`
    }));

    setSearchResults([...pages, ...students]);
  }, [searchQuery]);

  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  const handleSearchResultClick = (item: any) => {
    if (item.type === 'PAGE') {
      setCurrentView(item.id);
    } else if (item.type === 'STUDENT') {
      setCurrentView('students');
    }
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const handleUpdateUser = async (updatedData: Partial<User>) => {
    if (currentUser) {
       try {
         await api.updateUser(currentUser.id, updatedData);
         setCurrentUser(prev => prev ? ({ ...prev, ...updatedData }) : null);
       } catch (error) {
         console.error("Failed to update user", error);
       }
    }
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderView = () => {
    if (!currentUser) return null;

    const ViewComponent = () => {
      switch (currentView) {
        case 'dashboard': return <Dashboard user={currentUser} />;
        case 'profile': return <Profile user={currentUser} onUpdateUser={handleUpdateUser} />;
        case 'users': return <UserManagement />;
        case 'my-classes': return <MyClasses user={currentUser} />;
        case 'students': return <StudentList user={currentUser} />;
        case 'teachers': return <TeacherList />;
        case 'attendance': return <Attendance user={currentUser} />;
        case 'exams': return <Exams user={currentUser} />;
        case 'fees': return <Fees user={currentUser} />;
        case 'ai-assistant': return <AIAssistant />;
        default: return <Dashboard user={currentUser} />;
      }
    };

    return (
      <div key={currentView} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <ViewComponent />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <Loader2 size={40} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <Login onLogin={handleLogin} />
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-200 flex-col">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          role={currentUser.role} 
          currentView={currentView} 
          onChangeView={setCurrentView}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 h-20 flex items-center justify-between px-6 z-20 sticky top-0 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-4 lg:hidden">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Menu size={24} />
              </button>
            </div>

            <div className="flex-1 px-4 hidden lg:flex relative max-w-2xl">
              <div className={`relative w-full transition-all duration-300 ${isSearchFocused ? 'scale-105' : ''}`}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <Search className={`h-5 w-5 transition-colors ${isSearchFocused ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                  placeholder="Search pages, students, or records..."
                  className={`block w-full pl-11 pr-12 py-3 border-none rounded-xl leading-5 
                    ${isSearchFocused ? 'bg-white dark:bg-slate-800 shadow-lg ring-2 ring-indigo-500/20' : 'bg-gray-100/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-md'} 
                    text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-all duration-300 sm:text-sm`}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {searchQuery ? (
                      <button onClick={() => setSearchQuery('')} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <X size={16} />
                      </button>
                  ) : (
                      <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                          <Command size={10} className="text-gray-400" />
                          <span className="text-[10px] font-medium text-gray-400">K</span>
                      </div>
                  )}
                </div>

                {isSearchFocused && searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      {searchResults.length > 0 ? (
                          <div className="py-2">
                              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/50">Results</div>
                              {searchResults.map((item, idx) => (
                                  <button 
                                      key={idx} 
                                      onClick={() => handleSearchResultClick(item)}
                                      className="w-full text-left px-4 py-3 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 flex items-center gap-3 transition-colors group"
                                  >
                                      <div className={`p-2 rounded-lg ${item.type === 'PAGE' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'}`}>
                                          {item.icon ? <item.icon size={18} /> : <Users size={18} />}
                                      </div>
                                      <div className="flex-1">
                                          <div className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{item.label}</div>
                                          {item.detail && <div className="text-xs text-gray-500 dark:text-gray-400">{item.detail}</div>}
                                      </div>
                                      <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-400" />
                                  </button>
                              ))}
                          </div>
                      ) : (
                          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                              <p>No results found for "{searchQuery}"</p>
                          </div>
                      )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 flex items-center gap-2"
                title={`Switch to ${themeMode === 'system' ? 'Light' : themeMode === 'light' ? 'Dark' : 'System'} mode`}
              >
                {themeMode === 'light' ? <Sun size={22} /> : themeMode === 'dark' ? <Moon size={22} /> : <Monitor size={22} />}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                    isNotificationsOpen 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                  )}
                </button>

                <Notifications 
                  isOpen={isNotificationsOpen} 
                  onClose={() => setIsNotificationsOpen(false)}
                  notifications={notifications}
                  onMarkRead={handleMarkRead}
                  onMarkAllRead={handleMarkAllRead}
                />
              </div>
              
              <div className="h-8 w-px bg-gray-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
              
              <div className="flex items-center space-x-3 pl-1">
                <div 
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => setCurrentView('profile')}
                >
                  <div className="hidden md:block text-right group-hover:opacity-80 transition-opacity">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight">{currentUser.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{currentUser.role.toLowerCase()}</p>
                  </div>
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm ring-1 ring-gray-100 dark:ring-slate-700 group-hover:ring-indigo-300 transition-all"
                  />
                </div>
                
                <button 
                  onClick={handleLogout}
                  className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all ml-1"
                  title="Sign Out"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth bg-gray-50/50 dark:bg-slate-950/50">
            {isSearchFocused && (
              <div className="fixed inset-0 z-10" onClick={() => setIsSearchFocused(false)}></div>
            )}
            
            <div className="max-w-7xl mx-auto pb-10 relative z-0">
              {renderView()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
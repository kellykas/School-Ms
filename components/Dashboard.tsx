import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, DollarSign, UserCheck, TrendingUp, AlertCircle, ArrowUpRight, MoreHorizontal, BookOpen, Clock, Calendar, FileText } from 'lucide-react';
import { StatCardProps, User } from '../types';

interface DashboardProps {
  user?: User;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${trendUp ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
        {icon}
      </div>
      {trend && (
        <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700`}>
          <ArrowUpRight size={14} className="mr-1" /> {trend}
        </div>
      )}
    </div>
    <div>
      <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{title}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [stats, setStats] = useState({ students: 0, teachers: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getStats();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
      fetchStats();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Fallback for demo visualization
  const dataAttendance = [
    { name: 'Mon', present: 95 },
    { name: 'Tue', present: 92 },
    { name: 'Wed', present: 96 },
    { name: 'Thu', present: 89 },
    { name: 'Fri', present: 94 },
  ];

  const dataGrades = [
    { name: 'A', value: 30 },
    { name: 'B', value: 45 },
    { name: 'C', value: 15 },
    { name: 'D', value: 10 },
  ];
  const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#ef4444'];

  if (user?.role === 'STUDENT') {
    return (
      <div className="space-y-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Attendance" value="95%" icon={<UserCheck size={24} />} trend="Good" trendUp={true} />
          <StatCard title="Pending Tasks" value="3" icon={<Clock size={24} />} trendUp={false} />
        </div>
        {/* Simplified Student View for MVP */}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time school metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={loading ? "..." : stats.students} icon={<Users size={24} />} trend="Active" trendUp={true} />
        <StatCard title="Teachers" value={loading ? "..." : stats.teachers} icon={<BookOpen size={24} />} trend="Faculty" trendUp={true} />
        <StatCard title="Revenue" value={loading ? "..." : `$${stats.revenue.toLocaleString()}`} icon={<DollarSign size={24} />} trend="Collected" trendUp={true} />
        <StatCard title="Attendance" value="94.2%" icon={<UserCheck size={24} />} trend="Avg" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Weekly Attendance</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataAttendance}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[80, 100]} />
                <Tooltip />
                <Area type="monotone" dataKey="present" stroke="#6366f1" fillOpacity={1} fill="url(#colorPresent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
           <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Performance</h3>
           <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie data={dataGrades} cx="50%" cy="50%" innerRadius={60} outerRadius={80} dataKey="value">
                   {dataGrades.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
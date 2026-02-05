
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Save, Clock, CheckCircle, XCircle, Info, Loader2 } from 'lucide-react';
import { User, Student } from '../types';

interface AttendanceProps {
  user?: User;
}

const Attendance: React.FC<AttendanceProps> = ({ user }) => {
  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const isViewOnly = isStudent || isParent;

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Real Data State
  const [students, setStudents] = useState<Student[]>([]);
  
  // Calendar State for Student/Parent View
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Attendance State
  const [attendanceState, setAttendanceState] = useState<Record<string, 'PRESENT' | 'ABSENT' | 'LATE'>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Fetch Students on Mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.getStudents();
        setStudents(data);
        
        // Initialize attendance state for all fetched students
        const initialState: Record<string, 'PRESENT' | 'ABSENT' | 'LATE'> = {};
        data.forEach(s => initialState[s.id] = 'PRESENT');
        setAttendanceState(initialState);
      } catch (error) {
        console.error("Failed to fetch students for attendance", error);
      } finally {
        setLoading(false);
      }
    };

    // We only need to fetch students if we are Admin/Teacher OR Parent (to find the child)
    // Student logic is currently mock based, so we skip fetching full list for them
    if (!isStudent) {
      fetchStudents();
    } else {
      setLoading(false);
    }
  }, [isStudent]);

  const handleStatusChange = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    if (isViewOnly) return;
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkAction = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setAttendanceState(prev => {
      const newState = { ...prev };
      selectedIds.forEach(id => {
        newState[id] = status;
      });
      return newState;
    });
    setSelectedIds(new Set());
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    // Fix: Explicitly type the records array and cast status to string to satisfy api.submitAttendance's expected type
    const records: { studentId: string; status: string }[] = Object.entries(attendanceState).map(([studentId, status]) => ({
      studentId, status: status as string
    }));
    try {
      await api.submitAttendance(selectedDate, records);
      alert("Attendance saved successfully to database!");
    } catch(e: any) {
      alert("Failed to save attendance: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map(s => s.id)));
    }
  };

  const getStats = () => {
    const total = students.length;
    const present = Object.values(attendanceState).filter(s => s === 'PRESENT').length;
    const absent = Object.values(attendanceState).filter(s => s === 'ABSENT').length;
    const late = Object.values(attendanceState).filter(s => s === 'LATE').length;
    return { total, present, absent, late };
  };

  const stats = getStats();

  // Calendar Helpers for Student View
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCalendarDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getDayStatus = (day: number) => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    const today = new Date();
    today.setHours(0,0,0,0);

    if (date > today) return 'FUTURE';
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'WEEKEND';
    
    // In a real app, you would fetch the student's personal attendance record here
    if (day === 12 || day === 24) return 'ABSENT';
    if (day === 5 || day === 18) return 'LATE';
    
    return 'PRESENT';
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  // --- STUDENT / PARENT VIEW ---
  if (isViewOnly) {
    const daysInMonth = getDaysInMonth(calendarDate);
    const firstDay = getFirstDayOfMonth(calendarDate); // 0 = Sunday
    const emptySlots = Array(firstDay).fill(null);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    
    // If Parent, determine the child name to display
    let childName = "Student";
    if (isParent && students.length > 0) {
        const child = students.find(s => s.guardianName?.toLowerCase() === user?.name.toLowerCase());
        if (child) childName = child.name;
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isParent ? `Attendance: ${childName}` : 'My Attendance'}</h2>
            <p className="text-gray-500 mt-1">Record for Fall 2023 Term</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm font-medium text-gray-700">
             Overall Rate: <span className="text-green-600 font-bold">95%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-gray-900 text-lg">
                   {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                 </h3>
                 <div className="flex gap-2">
                    <button onClick={() => navigateMonth('prev')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronLeft size={20}/></button>
                    <button onClick={() => navigateMonth('next')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"><ChevronRight size={20}/></button>
                 </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-sm mb-4">
                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                   <div key={d} className="text-gray-400 font-semibold uppercase text-[10px] sm:text-xs tracking-wider">{d}</div>
                 ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                 {emptySlots.map((_, index) => <div key={`empty-${index}`} className="h-10 sm:h-12"></div>)}
                 {days.map(day => {
                    const status = getDayStatus(day);
                    let bgClass = 'bg-gray-50 text-gray-700';
                    let borderClass = 'border-transparent';
                    if (status === 'PRESENT') { bgClass = 'bg-green-50 text-green-700 font-bold'; borderClass = 'border-green-100'; }
                    if (status === 'ABSENT') { bgClass = 'bg-red-50 text-red-700 font-bold'; borderClass = 'border-red-100'; }
                    if (status === 'LATE') { bgClass = 'bg-yellow-50 text-yellow-700 font-bold'; borderClass = 'border-yellow-100'; }
                    if (status === 'WEEKEND') { bgClass = 'bg-gray-50 text-gray-400'; }
                    if (status === 'FUTURE') { bgClass = 'bg-white text-gray-300'; }

                    return (
                      <div key={day} className={`h-10 sm:h-12 rounded-lg flex items-center justify-center border ${bgClass} ${borderClass} text-sm`}>
                        {day}
                      </div>
                    )
                 })}
              </div>
           </div>
           
           <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-6">Attendance Summary</h3>
              <div className="space-y-4">
                 <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3"><CheckCircle size={18} className="text-green-600" /><span className="text-green-900 font-medium">Present</span></div>
                    <span className="text-green-800 font-bold text-xl">42</span>
                 </div>
                 <div className="flex justify-between items-center p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-3"><XCircle size={18} className="text-red-600" /><span className="text-red-900 font-medium">Absent</span></div>
                    <span className="text-red-800 font-bold text-xl">2</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  // --- TEACHER/ADMIN VIEW ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Attendance</h2>
          <p className="text-gray-500 mt-1">Track student presence</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
           <button className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronLeft size={20} /></button>
           <div className="flex items-center gap-2 text-sm font-medium text-gray-700 px-2">
             <CalendarIcon size={16} className="text-indigo-600" />
             {selectedDate}
           </div>
           <button className="p-1 hover:bg-gray-100 rounded text-gray-500"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm"><div className="text-xs font-semibold text-gray-500 uppercase">Total Students</div><div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div></div>
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm bg-green-50/30"><div className="text-xs font-semibold text-green-600 uppercase">Present</div><div className="text-2xl font-bold text-green-700 mt-1">{stats.present}</div></div>
        <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm bg-red-50/30"><div className="text-xs font-semibold text-red-600 uppercase">Absent</div><div className="text-2xl font-bold text-red-700 mt-1">{stats.absent}</div></div>
        <div className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm bg-yellow-50/30"><div className="text-xs font-semibold text-yellow-600 uppercase">Late</div><div className="text-2xl font-bold text-yellow-700 mt-1">{stats.late}</div></div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className={`p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${selectedIds.size > 0 ? 'bg-indigo-50' : 'bg-white'}`}>
          {selectedIds.size > 0 ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4">
               <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                 <span className="font-semibold text-indigo-900">{selectedIds.size} Selected</span>
                 <button onClick={() => setSelectedIds(new Set())} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Cancel</button>
               </div>
               <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
                  <button onClick={() => handleBulkAction('PRESENT')} className="px-3 py-1.5 bg-white text-green-700 border border-green-200 rounded text-xs font-bold hover:bg-green-50 uppercase">Mark Present</button>
                  <button onClick={() => handleBulkAction('ABSENT')} className="px-3 py-1.5 bg-white text-red-700 border border-red-200 rounded text-xs font-bold hover:bg-red-50 uppercase">Mark Absent</button>
                  <button onClick={() => handleBulkAction('LATE')} className="px-3 py-1.5 bg-white text-yellow-700 border border-yellow-200 rounded text-xs font-bold hover:bg-yellow-50 uppercase">Mark Late</button>
               </div>
            </div>
          ) : (
            <>
              <h3 className="font-semibold text-gray-800">Student List</h3>
              <button onClick={handleSaveAttendance} disabled={isSaving} className="flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">
                {isSaving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </button>
            </>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                <th className="px-4 sm:px-6 py-3 sm:py-4 w-12">
                   <input type="checkbox" className="h-4 w-4 rounded" checked={selectedIds.size === students.length && students.length > 0} onChange={toggleAll} />
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Student</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Roll ID</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {students.map((student) => {
                const status = attendanceState[student.id];
                const isSelected = selectedIds.has(student.id);
                return (
                  <tr key={student.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <input type="checkbox" className="h-4 w-4 rounded" checked={isSelected} onChange={() => toggleSelection(student.id)} />
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-gray-900">{student.name}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm text-gray-500">{student.id.toUpperCase()}</td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusChange(student.id, 'PRESENT')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${status === 'PRESENT' ? 'bg-green-100 text-green-800 ring-1 ring-green-600' : 'bg-gray-100 text-gray-600'}`}>Present</button>
                        <button onClick={() => handleStatusChange(student.id, 'ABSENT')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${status === 'ABSENT' ? 'bg-red-100 text-red-800 ring-1 ring-red-600' : 'bg-gray-100 text-gray-600'}`}>Absent</button>
                        <button onClick={() => handleStatusChange(student.id, 'LATE')} className={`flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${status === 'LATE' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-600' : 'bg-gray-100 text-gray-600'}`}>Late</button>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                      <input type="text" placeholder="Add note..." className="text-sm border-b border-gray-200 focus:border-indigo-500 focus:outline-none w-32 bg-transparent" />
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">No students found. Please add students in the directory.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;

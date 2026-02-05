import React, { useState, useMemo, useRef, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Filter, MoreHorizontal, Download, Users, Upload, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { User, Student } from '../types';

interface StudentListProps {
  user: User;
}

const StudentList: React.FC<StudentListProps> = ({ user }) => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isParent = user.role === 'PARENT';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const students = await api.getStudents();
      if (isParent) {
        // Filter students where guardian name matches current user
        // Note: In a real app, this filtering should happen on the backend
        const myChildren = students.filter(s => s.guardianName?.toLowerCase() === user.name.toLowerCase());
        setAllStudents(myChildren);
      } else {
        setAllStudents(students);
      }
    } catch (error) {
      console.error("Failed to fetch students", error);
    } finally {
      setLoading(false);
    }
  };

  const availableClasses = useMemo(() => {
    const classes = new Set(allStudents.map(s => `${s.grade}-${s.section}`));
    return ['All', ...Array.from(classes).sort()];
  }, [allStudents]);

  const filteredStudents = useMemo(() => {
    let filtered = allStudents;

    if (selectedClass !== 'All') {
      filtered = filtered.filter(s => `${s.grade}-${s.section}` === selectedClass);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.id.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedClass, allStudents]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').slice(1).filter(r => r.trim() !== '');
            const newStudents: Student[] = rows.map((row, idx) => {
                const cols = row.split(',');
                return {
                    id: `s-imp-${Date.now()}-${idx}`,
                    name: cols[0]?.trim() || 'Unknown',
                    grade: cols[1]?.trim() || '10',
                    section: cols[2]?.trim() || 'A',
                    guardianName: cols[3]?.trim() || 'Parent',
                    contact: cols[4]?.trim() || '',
                    attendanceRate: 100,
                    feesStatus: 'PENDING'
                };
            });

            if (newStudents.length > 0) {
                try {
                    await api.importStudents(newStudents);
                    alert(`Successfully imported ${newStudents.length} students.`);
                    fetchData();
                } catch(err: any) {
                    alert('Import failed: ' + err.message);
                }
            } else {
                alert("No valid data found in CSV. Expected format: Name,Grade,Section,Guardian,Contact");
            }
            setIsUploading(false);
        };
        reader.readAsText(file);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isParent ? 'My Children' : 'Student Directory'}</h1>
          <p className="text-gray-500 mt-1">
            {isParent ? 'View details for your enrolled children' : `Total ${allStudents.length} students enrolled`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {!isParent && (
            <>
              <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                <Download size={18} className="mr-2 text-gray-500" />
                Export
              </button>
              <button 
                onClick={handleImportClick}
                disabled={isUploading}
                className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
              >
                {isUploading ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Upload size={18} className="mr-2 text-gray-500" />}
                {isUploading ? 'Importing...' : 'Import CSV'}
              </button>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
            </>
          )}
          {user.role === 'ADMIN' && (
            <button className="flex items-center px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
              <Plus size={18} className="mr-2" />
              Add Student
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white shadow-sm"
            />
          </div>
          
          {!isParent && (
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-48">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-gray-400" />
                </div>
                <select 
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="block w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-sm appearance-none cursor-pointer"
                >
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls === 'All' ? 'All Classes' : `Class ${cls}`}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <ChevronDown size={14} className="text-gray-400" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Student Info</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Class</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Guardian Details</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Attendance</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">Status</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold mr-3 shadow-sm flex-shrink-0">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{student.name}</div>
                          <div className="text-xs text-gray-500 font-mono mt-0.5">#{student.id.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {student.grade}-{student.section}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="text-gray-900 text-sm font-medium">{student.guardianName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{student.contact}</div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 sm:w-20 bg-gray-100 rounded-full h-2 mr-3 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${student.attendanceRate > 90 ? 'bg-emerald-500' : student.attendanceRate > 75 ? 'bg-amber-400' : 'bg-rose-500'}`} 
                            style={{ width: `${student.attendanceRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">{student.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold
                        ${student.feesStatus === 'PAID' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20' : 
                          student.feesStatus === 'PENDING' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' : 
                          'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20'
                        }`}>
                        {student.feesStatus?.charAt(0) + student.feesStatus?.slice(1).toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-right whitespace-nowrap">
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users size={32} className="text-gray-300 mb-3" />
                      <p className="text-base font-medium text-gray-900">{isParent ? "No children found linked to your account." : "No students found"}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
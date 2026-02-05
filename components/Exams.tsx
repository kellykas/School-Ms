import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ExamResult, User } from '../types';
import { Award, TrendingUp, Loader2 } from 'lucide-react';

interface ExamsProps {
  user?: User;
}

const Exams: React.FC<ExamsProps> = ({ user }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await api.getExams();
        
        if (user?.role === 'PARENT') {
           // 1. Fetch students to find the parent's children
           const students = await api.getStudents();
           const myChildrenIds = new Set(
               students
                .filter(s => s.guardianName?.toLowerCase() === user.name.toLowerCase())
                .map(s => s.id)
           );
           
           // 2. Filter exams based on student IDs (and name fallback if ID missing in mock)
           const childResults = data.filter(r => myChildrenIds.has(r.studentId));
           setResults(childResults);
        } else if (user?.role === 'STUDENT') {
           // Filter for student by matching name
           const myResults = data.filter(r => r.studentName === user.name);
           setResults(myResults);
        } else {
           setResults(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadExams();
  }, [user]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-900">
           {user?.role === 'PARENT' ? "My Children's Grades" : user?.role === 'STUDENT' ? "My Grades" : "Exam Results"}
         </h2>
         {(user?.role === 'PARENT' || user?.role === 'STUDENT') && results.length > 0 && (
             <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-sm font-medium">
                 Average: {Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length)}%
             </span>
         )}
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                <tr>
                   <th className="px-6 py-4">Student</th>
                   <th className="px-6 py-4">Subject</th>
                   <th className="px-6 py-4">Score</th>
                   <th className="px-6 py-4">Grade</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
                {results.length > 0 ? results.map((res, i) => (
                   <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{res.studentName}</td>
                      <td className="px-6 py-4">{res.subject}</td>
                      <td className="px-6 py-4 font-bold">{res.score}/{res.total}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded font-bold text-xs ${res.grade.startsWith('A') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {res.grade}
                         </span>
                      </td>
                   </tr>
                )) : (
                    <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                            No exam results found.
                        </td>
                    </tr>
                )}
             </tbody>
          </table>
       </div>
    </div>
  );
};

export default Exams;
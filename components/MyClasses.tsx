import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, Assignment } from '../types';
import { 
  BookOpen, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  X, 
  Loader2, 
  Bell, 
  Upload, 
  FileCheck, 
  Calendar, 
  Paperclip, 
  Download,
  Info,
  ChevronRight,
  Users,
  ExternalLink,
  Zap,
  Check
} from 'lucide-react';

interface MyClassesProps {
  user: User;
}

type TabType = 'ASSIGNMENTS' | 'INFO';

const MyClasses: React.FC<MyClassesProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<TabType>('ASSIGNMENTS');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  
  const [submittedAssignments, setSubmittedAssignments] = useState<Set<string>>(new Set(['as1']));
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [newAssignment, setNewAssignment] = useState({
    title: '', description: '', dueDate: '', classId: '', subject: ''
  });

  const isTeacher = user.role === 'TEACHER';
  const isStudent = user.role === 'STUDENT';
  const isParent = user.role === 'PARENT';

  useEffect(() => {
    fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const data = await api.getAssignments();
      const students = await api.getStudents();
      
      if (isParent) {
         const myChildrenClasses = new Set(
            students
            .filter(s => s.guardianName?.toLowerCase() === user.name.toLowerCase())
            .map(s => `${s.grade}-${s.section}`)
         );
         const filteredData = data.filter(a => myChildrenClasses.has(a.classId));
         setAssignments(filteredData);
      } else if (isStudent) {
         const me = students.find(s => s.name === user.name);
         if (me) {
             const myClass = `${me.grade}-${me.section}`;
             const filteredData = data.filter(a => a.classId === myClass);
             setAssignments(filteredData);
         } else {
             setAssignments([]); 
         }
      } else {
         setAssignments(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAssignment({ ...newAssignment, status: 'OPEN' });
      setIsCreateModalOpen(false);
      fetchAssignments();
      setNewAssignment({title: '', description: '', dueDate: '', classId: '', subject: ''});
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemind = async (e: React.MouseEvent, assign: Assignment) => {
    e.stopPropagation();
    setRemindingId(assign.id);
    try {
      await api.sendEmailNotification({
        recipientName: `Students of Class ${assign.classId}`,
        subject: `REMINDER: ${assign.title} due on ${assign.dueDate}`,
        message: `Hello Students,\n\nThis is a friendly reminder that the assignment "${assign.title}" for ${assign.subject} is due on ${assign.dueDate}.\n\nPlease ensure you submit it on time.\n\nDescription: ${assign.description}\n\nBest,\n${user.name}`,
        type: 'ASSIGNMENT_REMINDER'
      });
      alert(`Reminder sent to Class ${assign.classId}!`);
    } catch (e) {
      console.error(e);
      alert("Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  const handleSubmitAssignment = async () => {
      if (!selectedAssignment) return;
      setSubmittingId(selectedAssignment.id);
      setTimeout(() => {
          setSubmittedAssignments(prev => {
              const newSet = new Set(prev);
              newSet.add(selectedAssignment.id);
              return newSet;
          });
          setSubmittingId(null);
      }, 1500);
  };

  const getStudentStatus = (assign: Assignment): 'SUBMITTED' | 'PENDING' | 'LATE' => {
     if (submittedAssignments.has(assign.id)) return 'SUBMITTED';
     const due = new Date(assign.dueDate);
     const today = new Date();
     today.setHours(0,0,0,0);
     due.setHours(0,0,0,0);
     if (today > due) return 'LATE';
     return 'PENDING';
  };

  const getTimeRemaining = (dueDate: string) => {
      const target = new Date(dueDate);
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      
      if (days < 0) return 'Expired';
      if (days === 0) return 'Due Today';
      if (days === 1) return 'Due Tomorrow';
      return `${days} days left`;
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Page Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isParent ? "Children's Academic Hub" : isStudent ? "My Learning Space" : "Classroom Management"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {isParent ? "Track homework and classroom announcements for your children" : "Manage your weekly tasks and classroom activities"}
            </p>
         </div>
         {isTeacher && (
           <button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all font-bold text-sm">
             <Plus size={18} /> Create Task
           </button>
         )}
       </div>

       {/* Tabs Interface */}
       <div className="flex items-center space-x-1 border-b border-gray-200 dark:border-slate-800">
         <button 
           onClick={() => setActiveTab('ASSIGNMENTS')}
           className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
             activeTab === 'ASSIGNMENTS' 
               ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
               : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-t-lg'
           }`}
         >
           <Zap size={18} className={activeTab === 'ASSIGNMENTS' ? 'text-indigo-600 dark:text-indigo-400' : ''} /> Assignments
         </button>
         <button 
           onClick={() => setActiveTab('INFO')}
           className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
             activeTab === 'INFO' 
               ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
               : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-t-lg'
           }`}
         >
           <Info size={18} /> Class Details
         </button>
       </div>

       {activeTab === 'ASSIGNMENTS' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
            {assignments.length > 0 ? assignments.map(assign => {
               const studentStatus = (isStudent || isParent) ? getStudentStatus(assign) : null;
               const timeRemaining = getTimeRemaining(assign.dueDate);

               return (
               <div 
                  key={assign.id} 
                  onClick={() => setSelectedAssignment(assign)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group cursor-pointer relative overflow-hidden"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex flex-col gap-1">
                        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-lg text-[10px] font-extrabold w-fit uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/30">
                            {assign.subject}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Class {assign.classId}</span>
                     </div>
                     <div className="flex flex-col items-end gap-1">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center ${
                            assign.status === 'OPEN' 
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-900/30' 
                                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700'
                        }`}>
                            {assign.status === 'OPEN' ? <Clock size={10} className="mr-1"/> : <CheckCircle size={10} className="mr-1"/>}
                            {assign.status}
                        </span>
                     </div>
                  </div>
                  
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-snug">
                      {assign.title}
                  </h3>
                  
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1 leading-relaxed">
                      {assign.description}
                  </p>
                  
                  <div className="pt-4 border-t border-gray-50 dark:border-slate-800 mt-auto flex items-center justify-between">
                     <div className={`flex items-center text-[11px] font-bold px-3 py-1.5 rounded-xl border ${
                         timeRemaining.includes('Expired') || timeRemaining.includes('Today')
                         ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30'
                         : 'bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-slate-700'
                     }`}>
                        <Calendar size={14} className="mr-2" /> 
                        {assign.dueDate}
                     </div>
                     
                     {(isStudent || isParent) && studentStatus && (
                        <div className={`p-2 rounded-full border shadow-sm transition-transform group-hover:scale-110 ${
                            studentStatus === 'SUBMITTED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                            studentStatus === 'LATE' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' :
                            'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                        }`} title={studentStatus}>
                            {studentStatus === 'SUBMITTED' ? <FileCheck size={16} /> :
                             studentStatus === 'LATE' ? <AlertCircle size={16} /> :
                             <Clock size={16} />}
                        </div>
                     )}
                  </div>
               </div>
            )}) : (
               <div className="col-span-full py-24 text-center">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen size={48} className="text-gray-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-bold text-xl">No assignments assigned yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed">
                      Assignments will appear here once published by your teacher. Stay tuned for updates!
                  </p>
               </div>
            )}
         </div>
       ) : (
         /* Class Details Tab Content */
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                    <Info size={24} className="text-indigo-600" /> General Information
                </h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Primary Teacher</span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">M</div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Mr. Anderson</p>
                                    <p className="text-xs text-gray-500">Mathematics Dept.</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                            <span className="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Class ID</span>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-700 dark:text-orange-400">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Grade 10-A</p>
                                    <p className="text-xs text-gray-500">Academic Year 2023-24</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                        <p>Welcome to your class portal. Here you can find essential documentation, class rules, and upcoming events specific to your section. Please ensure you check the assignments tab daily for new tasks and deadlines.</p>
                        <ul className="mt-4 list-disc pl-5 space-y-2">
                            <li>Check assignments daily before 6 PM</li>
                            <li>Late submissions require a valid parental note</li>
                            <li>Maintain classroom discipline in virtual sessions</li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 dark:shadow-none">
                <h4 className="text-lg font-bold mb-4">Quick Links</h4>
                <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-semibold backdrop-blur-md border border-white/10">
                        Class Syllabus <ExternalLink size={16} />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-semibold backdrop-blur-md border border-white/10">
                        Exam Schedule <ExternalLink size={16} />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm font-semibold backdrop-blur-md border border-white/10">
                        Contact Teacher <ExternalLink size={16} />
                    </button>
                </div>
                <div className="mt-12 p-5 bg-white/10 rounded-2xl border border-white/10">
                    <p className="text-xs text-indigo-100 mb-1">Upcoming Live Session</p>
                    <p className="text-sm font-bold">Linear Algebra Q&A</p>
                    <p className="text-[10px] opacity-70 mt-3 flex items-center gap-2">
                        <Clock size={12} /> Today at 4:30 PM
                    </p>
                </div>
            </div>
         </div>
       )}

       {/* Detailed Assignment Modal */}
       {selectedAssignment && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedAssignment(null)}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-4xl w-full p-0 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-slate-800">
               {/* Decorative Modal Background Element */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none"></div>
               
               {/* Modal Header */}
               <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 border-b border-gray-100 dark:border-slate-800 relative z-10">
                  <button 
                    onClick={() => setSelectedAssignment(null)} 
                    className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                  >
                    <X size={24}/>
                  </button>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-widest">
                          {selectedAssignment.subject}
                      </span>
                      <span className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border flex items-center ${
                          selectedAssignment.status === 'OPEN' 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-100 dark:border-green-800/30' 
                          : 'bg-gray-100 dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-slate-700'
                      }`}>
                          {selectedAssignment.status === 'OPEN' ? <Clock size={12} className="mr-1.5" /> : <CheckCircle size={12} className="mr-1.5" />}
                          {selectedAssignment.status} Assignment
                      </span>
                      {isStudent && submittedAssignments.has(selectedAssignment.id) && (
                          <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30 px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center">
                              <Check size={12} className="mr-1.5" /> Work Submitted
                          </span>
                      )}
                  </div>
                  
                  <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white leading-tight pr-12">
                      {selectedAssignment.title}
                  </h2>
               </div>
               
               {/* Modal Body */}
               <div className="overflow-y-auto flex-1 p-8 sm:p-10 space-y-10 relative bg-white dark:bg-slate-900 custom-scrollbar">
                   {/* Status & Timeline Visualization */}
                   <div className="flex flex-col sm:flex-row items-center gap-8 py-2">
                       <div className="flex-1 w-full grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Target Class</span>
                                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Users size={16} className="text-indigo-500" /> {selectedAssignment.classId}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Weightage</span>
                                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Zap size={16} className="text-amber-500" /> 15% Total
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</span>
                                <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar size={16} className="text-rose-500" /> {selectedAssignment.dueDate}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time Left</span>
                                <span className={`font-bold flex items-center gap-2 ${getTimeRemaining(selectedAssignment.dueDate).includes('left') ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600'}`}>
                                    <Clock size={16} /> {getTimeRemaining(selectedAssignment.dueDate)}
                                </span>
                            </div>
                       </div>
                   </div>

                   {/* Description Section */}
                   <div className="space-y-4">
                       <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                           <FileText size={18} className="text-indigo-600" /> Instructions & Description
                       </h4>
                       <div className="bg-gray-50 dark:bg-slate-800/40 p-8 rounded-[2rem] border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap shadow-inner font-medium">
                           {selectedAssignment.description || "No specific instructions have been provided for this task."}
                       </div>
                   </div>

                   {/* Resource Attachments Card Section */}
                   <div className="space-y-4">
                       <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                           <Paperclip size={18} className="text-indigo-600" /> Resource Center
                       </h4>
                       {selectedAssignment.attachmentName ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="group flex items-center justify-between p-5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
                                            <FileText size={24} />
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white block truncate max-w-[150px]">{selectedAssignment.attachmentName}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase">Portable Document Format</span>
                                        </div>
                                    </div>
                                    <button className="p-3 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all">
                                        <Download size={20} />
                                    </button>
                                </div>
                            </div>
                       ) : (
                           <div className="p-10 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl text-center">
                               <p className="text-sm text-gray-400 font-bold italic">No reference documents provided.</p>
                           </div>
                       )}
                   </div>
               </div>

               {/* Modal Footer Actions - Dynamic based on role and status */}
               <div className="p-8 sm:px-10 sm:py-8 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end items-center gap-4 relative z-10 transition-colors">
                   <button 
                    onClick={() => setSelectedAssignment(null)} 
                    className="w-full sm:w-auto px-8 py-3 border border-gray-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-colors order-2 sm:order-1"
                   >
                    Back to List
                   </button>
                   
                   {isTeacher && (
                        <button 
                            onClick={(e) => handleRemind(e, selectedAssignment)}
                            disabled={!!remindingId}
                            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center order-1 sm:order-2"
                        >
                             {remindingId === selectedAssignment.id ? <Loader2 size={20} className="animate-spin mr-2" /> : <Bell size={20} className="mr-2" />}
                             {remindingId === selectedAssignment.id ? 'Broadcasting...' : 'Nudge Students'}
                        </button>
                   )}
                   
                   {isStudent && (
                        <button 
                            onClick={handleSubmitAssignment}
                            disabled={getStudentStatus(selectedAssignment) === 'SUBMITTED' || !!submittingId}
                            className={`w-full sm:w-auto px-10 py-3 rounded-2xl text-sm font-bold shadow-xl transition-all flex items-center justify-center order-1 sm:order-2 ${
                                getStudentStatus(selectedAssignment) === 'SUBMITTED'
                                ? 'bg-emerald-600 text-white cursor-default shadow-emerald-100 dark:shadow-none translate-y-0 opacity-80'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-1 shadow-indigo-200 dark:shadow-none'
                            }`}
                        >
                             {submittingId === selectedAssignment.id ? (
                                 <Loader2 size={20} className="mr-2 animate-spin" />
                             ) : getStudentStatus(selectedAssignment) === 'SUBMITTED' ? (
                                 <CheckCircle size={20} className="mr-2" />
                             ) : (
                                 <Upload size={20} className="mr-2" />
                             )}
                             {submittingId === selectedAssignment.id ? 'Uploading...' : getStudentStatus(selectedAssignment) === 'SUBMITTED' ? 'Completed' : 'Submit My Work'}
                        </button>
                   )}
               </div>
            </div>
         </div>
       )}
       
       {/* Create New Assignment Modal (Teacher Exclusive) */}
       {isCreateModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8 sm:p-10 transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="font-black text-2xl text-gray-900 dark:text-white">Post New Task</h3>
                 <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleCreate} className="space-y-6">
                  <div>
                    <label className="block text-[11px] uppercase font-black text-gray-500 dark:text-gray-400 mb-2 tracking-widest">Task Title</label>
                    <input className="w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold" placeholder="e.g. History Analysis" required onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] uppercase font-black text-gray-500 dark:text-gray-400 mb-2 tracking-widest">Class ID</label>
                        <input className="w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold" placeholder="10-A" required onChange={e => setNewAssignment({...newAssignment, classId: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase font-black text-gray-500 dark:text-gray-400 mb-2 tracking-widest">Subject</label>
                        <input className="w-full px-5 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold" placeholder="History" required onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})} />
                      </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-black text-gray-500 dark:text-gray-400 mb-2 tracking-widest">Instructions</label>
                    <textarea className="w-full px-5 py-4 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white min-h-[140px] transition-all resize-none font-medium leading-relaxed" placeholder="Detailed instructions for students..." required onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase font-black text-gray-500 dark:text-gray-400 mb-2 tracking-widest">Deadline</label>
                    <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input type="date" className="w-full pl-12 pr-5 py-3.5 bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-gray-900 dark:text-white transition-all font-semibold" required onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 dark:border-slate-800 mt-6 transition-colors">
                     <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-6 py-3 border border-gray-300 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                     <button type="submit" className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all">Publish Task</button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default MyClasses;
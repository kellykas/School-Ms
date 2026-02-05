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
  // Fix: Added missing Users icon from lucide-react
  Users
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

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
       {/* Page Header */}
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isParent ? "Child's Classes" : isStudent ? "My Classes" : "Class Management"}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
                {isParent ? "Overview of coursework and class information for your children" : "Manage assignments and view class details"}
            </p>
         </div>
         {isTeacher && (
           <button onClick={() => setIsCreateModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all font-bold text-sm">
             <Plus size={18} /> New Assignment
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
               : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
           }`}
         >
           <FileText size={18} /> Assignments
         </button>
         <button 
           onClick={() => setActiveTab('INFO')}
           className={`px-6 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${
             activeTab === 'INFO' 
               ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
               : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
           }`}
         >
           <Info size={18} /> Class Info
         </button>
       </div>

       {activeTab === 'ASSIGNMENTS' ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {assignments.length > 0 ? assignments.map(assign => {
               const studentStatus = (isStudent || isParent) ? getStudentStatus(assign) : null;
               return (
               <div 
                  key={assign.id} 
                  onClick={() => setSelectedAssignment(assign)}
                  className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group cursor-pointer relative overflow-hidden"
               >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} className="text-indigo-500" />
                  </div>

                  <div className="flex justify-between items-start mb-3">
                     <div className="flex flex-col">
                        <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-md text-[10px] font-bold w-fit mb-1 uppercase tracking-wider">
                            {assign.subject}
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">Class {assign.classId}</span>
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
                  
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {assign.title}
                  </h3>
                  
                  {assign.attachmentName && (
                      <div className="mb-3 flex items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800/50 w-fit">
                          <Paperclip size={12} className="mr-1" /> Attachment Included
                      </div>
                  )}
                  
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-1 italic">
                      {assign.description}
                  </p>
                  
                  <div className="pt-4 border-t border-gray-50 dark:border-slate-800 mt-auto flex items-center justify-between gap-2">
                     <div className="flex items-center text-[11px] text-gray-500 dark:text-gray-400 font-semibold bg-gray-50 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-slate-700">
                        <Calendar size={14} className="mr-1.5 text-indigo-500" /> 
                        Due: {assign.dueDate}
                     </div>
                     
                     {(isStudent || isParent) && studentStatus && (
                        <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center shadow-sm ${
                            studentStatus === 'SUBMITTED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30' :
                            studentStatus === 'LATE' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/30' :
                            'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30'
                        }`}>
                            {studentStatus === 'SUBMITTED' && <FileCheck size={14} className="mr-1.5" />}
                            {studentStatus === 'LATE' && <AlertCircle size={14} className="mr-1.5" />}
                            {studentStatus === 'PENDING' && <Upload size={14} className="mr-1.5" />}
                            {studentStatus}
                        </div>
                     )}
                  </div>
               </div>
            )}) : (
               <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={40} className="text-gray-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white font-bold text-xl">No assignments found</h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Check back later or change your filters.</p>
               </div>
            )}
         </div>
       ) : (
         /* Class Info Tab Content */
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Info size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Class Overview</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    This section contains class schedules, teacher contact information, and syllabus details. This content is currently being updated.
                </p>
            </div>
         </div>
       )}

       {/* Detail Modal View */}
       {selectedAssignment && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedAssignment(null)}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full p-0 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 dark:border-slate-800">
               {/* Modal Header */}
               <div className="bg-indigo-600 p-6 sm:p-8 text-white relative">
                  <button 
                    onClick={() => setSelectedAssignment(null)} 
                    className="absolute top-4 right-4 text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={24}/>
                  </button>
                  
                  <div className="flex items-center gap-2 mb-3">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest border border-white/20">
                          {selectedAssignment.subject}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center backdrop-blur-md ${
                          selectedAssignment.status === 'OPEN' ? 'bg-green-500/20 border-green-400/30' : 'bg-white/10 border-white/20'
                      }`}>
                          {selectedAssignment.status}
                      </span>
                  </div>
                  
                  <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">{selectedAssignment.title}</h2>
               </div>
               
               {/* Modal Body */}
               <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-8">
                   {/* Info Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
                           <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-2">Target Audience</span>
                           <div className="flex items-center text-gray-900 dark:text-white font-bold">
                               <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg mr-3">
                                   <Users size={18} />
                               </div>
                               Class {selectedAssignment.classId}
                           </div>
                       </div>
                       <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 transition-colors">
                           <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider block mb-2">Final Submission Date</span>
                           <div className="flex items-center text-gray-900 dark:text-white font-bold">
                               <div className="p-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg mr-3">
                                   <Calendar size={18} />
                               </div>
                               {selectedAssignment.dueDate}
                           </div>
                       </div>
                   </div>

                   {/* Description */}
                   <div className="space-y-3">
                       <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           <FileText size={18} className="text-indigo-500"/> Assignment Description
                       </h4>
                       <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap shadow-inner">
                           {selectedAssignment.description || "No detailed description provided for this task."}
                       </div>
                   </div>

                   {/* Attachments */}
                   <div className="space-y-3">
                       <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                           <Paperclip size={18} className="text-indigo-500"/> Resource Attachments
                       </h4>
                       {selectedAssignment.attachmentName ? (
                            <div className="group flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl hover:border-indigo-500 dark:hover:border-indigo-400 transition-all shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{selectedAssignment.attachmentName}</span>
                                        <span className="text-[10px] text-gray-400 uppercase font-semibold">PDF Document • 1.2 MB</span>
                                    </div>
                                </div>
                                <button className="p-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all" title="Download Resource">
                                    <Download size={20} />
                                </button>
                            </div>
                       ) : (
                           <div className="p-4 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-2xl text-center">
                               <p className="text-xs text-gray-400 font-medium italic">No attachments provided for this assignment.</p>
                           </div>
                       )}
                   </div>
               </div>

               {/* Modal Footer Actions */}
               <div className="p-6 sm:px-8 sm:py-6 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex flex-col sm:flex-row justify-end gap-3 transition-colors">
                   <button 
                    onClick={() => setSelectedAssignment(null)} 
                    className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 transition-colors order-2 sm:order-1"
                   >
                    Close
                   </button>
                   
                   {isTeacher && (
                        <button 
                            onClick={(e) => handleRemind(e, selectedAssignment)}
                            disabled={!!remindingId}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center order-1 sm:order-2"
                        >
                             {remindingId === selectedAssignment.id ? <Loader2 size={18} className="animate-spin mr-2" /> : <Bell size={18} className="mr-2" />}
                             {remindingId === selectedAssignment.id ? 'Sending...' : 'Send Class Reminder'}
                        </button>
                   )}
                   
                   {isStudent && (
                        <button 
                            onClick={handleSubmitAssignment}
                            disabled={getStudentStatus(selectedAssignment) === 'SUBMITTED' || !!submittingId}
                            className={`px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center justify-center order-1 sm:order-2 ${
                                getStudentStatus(selectedAssignment) === 'SUBMITTED'
                                ? 'bg-emerald-600 text-white cursor-default shadow-emerald-100 dark:shadow-none'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                            }`}
                        >
                             {submittingId === selectedAssignment.id ? (
                                 <Loader2 size={18} className="mr-2 animate-spin" />
                             ) : getStudentStatus(selectedAssignment) === 'SUBMITTED' ? (
                                 <CheckCircle size={18} className="mr-2" />
                             ) : (
                                 <Upload size={18} className="mr-2" />
                             )}
                             {submittingId === selectedAssignment.id ? 'Submitting...' : getStudentStatus(selectedAssignment) === 'SUBMITTED' ? 'Work Submitted' : 'Submit My Work'}
                        </button>
                   )}
               </div>
            </div>
         </div>
       )}
       
       {/* Create New Assignment Modal (Teacher Only) */}
       {isCreateModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsCreateModalOpen(false)}></div>
            <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 transform transition-all animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-xl text-gray-900 dark:text-white">New Assignment</h3>
                 <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={20}/></button>
               </div>
               
               <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">Assignment Title</label>
                    <input className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all" placeholder="e.g. Calculus Midterm Project" required onChange={e => setNewAssignment({...newAssignment, title: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">Target Class</label>
                        <input className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all" placeholder="e.g. 10-A" required onChange={e => setNewAssignment({...newAssignment, classId: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">Subject</label>
                        <input className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all" placeholder="e.g. Math" required onChange={e => setNewAssignment({...newAssignment, subject: e.target.value})} />
                      </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">Detailed Description</label>
                    <textarea className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white min-h-[120px] transition-all resize-none" placeholder="Provide instructions for the students..." required onChange={e => setNewAssignment({...newAssignment, description: e.target.value})} />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-1.5 tracking-wider">Due Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="date" className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white transition-all" required onChange={e => setNewAssignment({...newAssignment, dueDate: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 mt-4 transition-colors">
                     <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-5 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">Cancel</button>
                     <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">Publish Assignment</button>
                  </div>
               </form>
            </div>
         </div>
       )}
    </div>
  );
};

export default MyClasses;
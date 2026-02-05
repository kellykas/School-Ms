import React, { useState, useRef, useEffect } from 'react';
import { User, Student } from '../types';
import { api } from '../services/api';
import { User as UserIcon, Phone, Mail, MapPin, Shield, Calendar, BookOpen, Edit2, Camera, X, Upload, Save } from 'lucide-react';

interface ProfileProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const [studentData, setStudentData] = useState<Student | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user.name,
    email: user.email,
    phone: '',
    address: '123 Education Lane, Knowledge City',
    avatarUrl: user.avatarUrl || ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If user is a student, fetch their specific details
    if (user.role === 'STUDENT') {
        api.getStudents().then(students => {
             const match = students.find(s => s.name === user.name);
             if (match) {
                 setStudentData(match);
                 setEditForm(prev => ({ ...prev, phone: match.contact }));
             }
        });
    } else {
        setEditForm(prev => ({ ...prev, phone: '+1 234 567 890' }));
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Update global user state
    onUpdateUser({
        name: editForm.name,
        email: editForm.email,
        avatarUrl: editForm.avatarUrl
    });

    // Update local student data state (mock persistence)
    if (studentData) {
        setStudentData({
            ...studentData,
            contact: editForm.phone
        });
    }

    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Banner/Header */}
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-600 relative">
            {user.role !== 'STUDENT' && (
            <button 
                onClick={() => setIsEditing(true)}
                className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-all border border-white/30"
            >
                <Edit2 size={16} className="mr-2" />
                Edit Profile
            </button>
            )}
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex flex-col sm:flex-row items-center sm:items-end -mt-12 mb-6 text-center sm:text-left">
            <div className="relative">
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="h-24 w-24 rounded-full border-4 border-white shadow-md bg-white object-cover"
                />
            </div>
            <div className="mt-4 sm:mt-0 sm:ml-6 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {user.role}
                </span>
                <span className="text-xs text-gray-500">
                    {user.status === 'ACTIVE' ? '• Active Account' : '• Inactive'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <UserIcon size={20} className="text-gray-400" />
                Personal Information
              </h3>
              
              <div className="bg-gray-50 rounded-xl p-6 space-y-4 border border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold">User ID</label>
                    <p className="text-gray-900 font-medium truncate">{user.id.toUpperCase()}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 uppercase font-semibold">Date of Birth</label>
                    <p className="text-gray-900 font-medium">15 Aug 2008</p>
                  </div>
                  {studentData && (
                    <>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Grade/Class</label>
                            <p className="text-gray-900 font-medium">{studentData.grade} - Section {studentData.section}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Blood Group</label>
                            <p className="text-gray-900 font-medium">O+</p>
                        </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center text-gray-600">
                    <Mail size={18} className="mr-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                 </div>
                 <div className="flex items-center text-gray-600">
                    <Phone size={18} className="mr-3 text-gray-400 flex-shrink-0" />
                    <span>{editForm.phone}</span>
                 </div>
                 <div className="flex items-center text-gray-600">
                    <MapPin size={18} className="mr-3 text-gray-400 flex-shrink-0" />
                    <span>{editForm.address}</span>
                 </div>
              </div>
            </div>

            {/* Academic & Guardian Details */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Shield size={20} className="text-gray-400" />
                {user.role === 'STUDENT' ? 'Guardian & Academic Info' : 'Department Info'}
              </h3>
              
              {user.role === 'STUDENT' ? (
                  <>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                        <div className="flex items-start justify-between pb-4 border-b border-gray-100">
                            <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Guardian Name</label>
                            <p className="text-gray-900 font-medium text-lg">{studentData?.guardianName || 'Loading...'}</p>
                            <p className="text-sm text-gray-500">Relationship: Parent/Guardian</p>
                            </div>
                        </div>
                        
                        <div className="pt-2">
                        <label className="text-xs text-gray-500 uppercase font-semibold mb-3 block">Current Enrollment</label>
                        <div className="flex gap-3 flex-wrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                                <BookOpen size={14} className="mr-1.5" /> Mathematics
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-green-50 text-green-700 text-sm font-medium">
                                <BookOpen size={14} className="mr-1.5" /> Science
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-yellow-50 text-yellow-700 text-sm font-medium">
                                <BookOpen size={14} className="mr-1.5" /> History
                            </span>
                            <span className="inline-flex items-center px-3 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                                <BookOpen size={14} className="mr-1.5" /> English Lit
                            </span>
                        </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                        <div className="flex items-center gap-3 mb-2">
                        <Calendar className="text-indigo-600" size={20} />
                        <h4 className="font-semibold text-indigo-900">Academic Calendar</h4>
                        </div>
                        <p className="text-sm text-indigo-700 mb-3">Current Term: Fall 2023</p>
                        <div className="w-full bg-indigo-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                        <p className="text-xs text-indigo-600 mt-2 text-right">65% of term completed</p>
                    </div>
                  </>
              ) : (
                  <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 text-center text-gray-500">
                      <p>Faculty information is managed by the administration.</p>
                  </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div 
                className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" 
                onClick={() => setIsEditing(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-xl font-bold text-gray-900" id="modal-title">Edit Profile</h3>
                  <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-500 transition-colors p-1 hover:bg-gray-100 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-5">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-50 shadow-sm overflow-hidden bg-gray-100 hover:border-indigo-100 transition-colors">
                                {editForm.avatarUrl ? (
                                    <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <Camera size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full shadow-md hover:bg-indigo-700 transition-colors">
                                <Upload size={14} />
                            </div>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <p className="text-xs text-gray-500 mt-2">Click to change profile picture</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input
                            type="text"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                            type="text"
                            value={editForm.address}
                            onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors flex items-center"
                    >
                        <Save size={16} className="mr-2" />
                        Save Changes
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
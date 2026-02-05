import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { User, Role, AuditLog } from '../types';
import { Search, Plus, Filter, Edit2, Ban, CheckCircle, Shield, X, Mail, Eye, EyeOff, Key, Camera, Upload, Loader2, MoreVertical, Copy, History, List, Lock } from 'lucide-react';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'LOGS'>('USERS');
  
  // Users State
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // UI State for Password Visibility in Table
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  
  // Form State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'STUDENT' as Role,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE',
    password: '',
    avatarUrl: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'LOGS') {
        loadAuditLogs();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLogs = async () => {
    setLoadingLogs(true);
    try {
        const data = await api.getAuditLogs();
        setAuditLogs(data);
    } catch(e) {
        console.error(e);
    } finally {
        setLoadingLogs(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleOpenModal = (user?: User) => {
    setShowFormPassword(false);
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status || 'ACTIVE',
        password: '', // Empty means unchanged
        avatarUrl: user.avatarUrl || '',
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'STUDENT',
        status: 'ACTIVE',
        password: '',
        avatarUrl: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Only send password if it was changed (non-empty)
        const updateData: Partial<User> = { ...formData };
        if (!updateData.password) delete updateData.password;
        
        await api.updateUser(editingUser.id, updateData);
      } else {
        await api.createUser(formData);
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (e) {
      console.error("Failed to save user", e);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(userId)) {
      newSet.delete(userId);
    } else {
      newSet.add(userId);
    }
    setVisiblePasswords(newSet);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Administration</h1>
          <p className="text-gray-500 mt-1">
            Manage system accounts, access control, and review audit trails.
          </p>
        </div>
        
        {activeTab === 'USERS' && (
            <button 
            onClick={() => handleOpenModal()}
            className="flex items-center px-4 py-2 bg-indigo-600 rounded-xl text-sm font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
            >
            <Plus size={18} className="mr-2" />
            Add User
            </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1 border-b border-gray-200">
         <button 
           onClick={() => setActiveTab('USERS')}
           className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'USERS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'}`}
         >
           <List size={16} /> User List
         </button>
         <button 
           onClick={() => setActiveTab('LOGS')}
           className={`px-4 py-2 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'LOGS' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-t-lg'}`}
         >
           <History size={16} /> Audit Logs
         </button>
      </div>

      {activeTab === 'USERS' && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white shadow-sm"
            />
          </div>
          <div className="w-full sm:w-48 relative">
             <Filter className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
             <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as Role | 'ALL')}
                className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
              </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Password</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.status === 'INACTIVE' ? 'bg-gray-50/50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                       <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} className={`h-10 w-10 rounded-full mr-3 border border-gray-200 object-cover ${user.status === 'INACTIVE' ? 'grayscale opacity-70' : ''}`} />
                       <div className={`font-semibold ${user.status === 'INACTIVE' ? 'text-gray-500' : 'text-gray-900'}`}>{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${
                        user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        user.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        user.role === 'PARENT' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2 group">
                        <span className="font-mono text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded border border-gray-100 min-w-[100px] inline-block text-center">
                            {visiblePasswords.has(user.id) 
                                ? (user.password || '<Encrypted>') 
                                : '••••••••'}
                        </span>
                        <button 
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="text-gray-400 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100"
                            title={visiblePasswords.has(user.id) ? "Hide Password" : "Show Password"}
                        >
                            {visiblePasswords.has(user.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                         user.status === 'ACTIVE' 
                           ? 'bg-green-50 text-green-700 border-green-100' 
                           : 'bg-red-50 text-red-700 border-red-100'
                       }`}>
                       {user.status === 'ACTIVE' ? <CheckCircle size={12} className="mr-1.5" /> : <Ban size={12} className="mr-1.5" />}
                       {user.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                        onClick={() => handleOpenModal(user)} 
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Edit User & Password"
                    >
                        <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                          No users found matching your search.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
           {loadingLogs ? (
               <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-600" /></div>
           ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider font-semibold border-b border-gray-100">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Target User</th>
                    <th className="px-6 py-4">Details</th>
                    <th className="px-6 py-4 text-right">Performed By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 bg-white">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                         <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                            log.action === 'USER_CREATED' ? 'bg-green-50 text-green-700 border-green-100' :
                            log.action === 'PASSWORD_RESET' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                            log.action === 'STATUS_CHANGE' ? 'bg-red-50 text-red-700 border-red-100' :
                            'bg-blue-50 text-blue-700 border-blue-100'
                         }`}>
                             {log.action === 'PASSWORD_RESET' && <Key size={10} className="mr-1.5" />}
                             {log.action === 'USER_CREATED' && <Plus size={10} className="mr-1.5" />}
                             {log.action === 'STATUS_CHANGE' && <Ban size={10} className="mr-1.5" />}
                             {log.action.replace('_', ' ')}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {log.targetUserName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                          {log.details}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-500 font-mono">
                          {log.performedBy}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                      <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                              No audit records found.
                          </td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
           )}
        </div>
      )}

      {/* Create/Edit Modal (Same as before) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
           <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{editingUser ? 'Edit User Account' : 'Create New User'}</h3>
                    {editingUser && <p className="text-sm text-gray-500 mt-1">Editing details for {editingUser.name}</p>}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                        placeholder="e.g. John Doe" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        required 
                    />
                 </div>
                 
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                            type="email" 
                            placeholder="user@school.com" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            required 
                        />
                    </div>
                 </div>

                 <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                         {editingUser ? 'Reset Password' : 'Password'}
                         {editingUser && <span className="ml-2 text-xs font-normal text-gray-400">(Leave blank to keep current)</span>}
                     </label>
                     <div className="relative">
                         <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                         <input 
                             className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" 
                             type={showFormPassword ? "text" : "password"} 
                             placeholder={editingUser ? "Enter new password to reset" : "••••••••"} 
                             value={formData.password} 
                             onChange={e => setFormData({...formData, password: e.target.value})} 
                             required={!editingUser}
                         />
                         <button 
                             type="button"
                             onClick={() => setShowFormPassword(!showFormPassword)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                         >
                             {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                         </button>
                     </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <div className="relative">
                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select 
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white appearance-none cursor-pointer" 
                                value={formData.role} 
                                onChange={e => setFormData({...formData, role: e.target.value as Role})}
                            >
                                <option value="ADMIN">Admin</option>
                                <option value="TEACHER">Teacher</option>
                                <option value="STUDENT">Student</option>
                                <option value="PARENT">Parent</option>
                            </select>
                        </div>
                     </div>
                     
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Status</label>
                        <select 
                            className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white appearance-none cursor-pointer font-medium ${
                                formData.status === 'ACTIVE' ? 'text-green-700 border-green-200 bg-green-50/30' : 'text-red-700 border-red-200 bg-red-50/30'
                            }`}
                            value={formData.status} 
                            onChange={e => setFormData({...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE'})}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                     </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-2">
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(false)} 
                        className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-colors"
                    >
                        {editingUser ? 'Save Changes' : 'Create User'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
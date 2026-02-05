import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { DollarSign, AlertCircle, CheckCircle, Clock, Receipt, CreditCard, Loader2, Mail, Send } from 'lucide-react';
import { User } from '../types';

interface FeesProps {
  user?: User;
}

const Fees: React.FC<FeesProps> = ({ user }) => {
  const [feeRecords, setFeeRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  // Check role
  const isAdminOrTeacher = user?.role === 'ADMIN' || user?.role === 'TEACHER';
  const isParent = user?.role === 'PARENT';
  const isStudent = user?.role === 'STUDENT';

  useEffect(() => {
    const loadFees = async () => {
      try {
        const data = await api.getFees();
        
        if (isParent) {
            // Filter fees to show only those belonging to the parent's children
            const students = await api.getStudents();
            const myChildrenIds = new Set(
                students
                .filter(s => s.guardianName?.toLowerCase() === user.name.toLowerCase())
                .map(s => s.id)
            );
            
            const myFees = data.filter(f => myChildrenIds.has(f.studentId));
            setFeeRecords(myFees);
        } else if (isStudent) {
            // Filter fees for student (match by name since seed data matches name)
            const myFees = data.filter(f => f.name === user.name);
            setFeeRecords(myFees);
        } else {
            setFeeRecords(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadFees();
  }, [user]);

  const handlePay = async (invoiceId: string) => {
    setProcessingId(invoiceId);
    try {
      await api.payFee(invoiceId);
      // Optimistic update
      setFeeRecords(prev => prev.map(f => f.invoiceId === invoiceId ? { ...f, feesStatus: 'PAID' } : f));
    } catch (e) {
      console.error(e);
      alert("Payment failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemind = async (fee: any) => {
    setRemindingId(fee.invoiceId);
    try {
      await api.sendEmailNotification({
        recipientName: fee.name,
        subject: `Payment Reminder: Invoice #${fee.invoiceId}`,
        message: `Dear ${fee.name},\n\nThis is a reminder that your fee payment of $${fee.amount} for invoice #${fee.invoiceId} is currently ${fee.feesStatus.toLowerCase()}. Please arrange for payment by ${fee.dueDate}.\n\nThank you,\nSchool Administration`,
        type: 'FEE_REMINDER'
      });
      alert(`Reminder sent to ${fee.name}!`);
    } catch (e) {
      console.error(e);
      alert("Failed to send reminder");
    } finally {
      setRemindingId(null);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
       <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{isParent || isStudent ? 'My Payments' : 'Fee Management'}</h2>
            <p className="text-gray-500 mt-1">{isParent || isStudent ? 'View and pay school fees' : 'Track payments and invoices'}</p>
          </div>
          {isAdminOrTeacher && (
             <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
               <InfoIcon /> Admin Mode: You can send reminders for pending fees.
             </div>
          )}
       </div>

       <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
               <tr>
                 <th className="px-6 py-4">Invoice ID</th>
                 <th className="px-6 py-4">Student</th>
                 <th className="px-6 py-4">Amount</th>
                 <th className="px-6 py-4">Due Date</th>
                 <th className="px-6 py-4">Status</th>
                 <th className="px-6 py-4 text-right">Action</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
               {feeRecords.length > 0 ? feeRecords.map(fee => (
                 <tr key={fee.invoiceId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-medium text-gray-500">{fee.invoiceId}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{fee.name}</td>
                    <td className="px-6 py-4 font-bold text-gray-800">${fee.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{fee.dueDate}</td>
                    <td className="px-6 py-4">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${
                         fee.feesStatus === 'PAID' 
                           ? 'bg-green-50 text-green-700 border-green-100' 
                           : 'bg-amber-50 text-amber-700 border-amber-100'
                       }`}>
                         {fee.feesStatus === 'PAID' && <CheckCircle size={10} className="mr-1" />}
                         {fee.feesStatus !== 'PAID' && <Clock size={10} className="mr-1" />}
                         {fee.feesStatus}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {/* Logic: If Admin/Teacher -> Show "Remind" for unpaid. If Student/Parent -> Show "Pay" for unpaid. */}
                       
                       {fee.feesStatus !== 'PAID' && (
                         <>
                           {isAdminOrTeacher ? (
                              <button 
                                onClick={() => handleRemind(fee)}
                                disabled={!!remindingId}
                                className="inline-flex items-center bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 hover:text-indigo-600 transition-colors disabled:opacity-50"
                              >
                                {remindingId === fee.invoiceId ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Mail size={12} className="mr-1.5" />}
                                {remindingId === fee.invoiceId ? 'Sending...' : 'Remind'}
                              </button>
                           ) : (
                              <button 
                                onClick={() => handlePay(fee.invoiceId)}
                                disabled={!!processingId}
                                className="inline-flex items-center bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm shadow-indigo-200 disabled:opacity-50 transition-all"
                              >
                                {processingId === fee.invoiceId ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <CreditCard size={12} className="mr-1.5" />}
                                {processingId === fee.invoiceId ? 'Processing...' : 'Pay Now'}
                              </button>
                           )}
                         </>
                       )}
                       
                       {fee.feesStatus === 'PAID' && (
                          <span className="text-gray-400 text-xs font-medium flex items-center justify-end">
                            <Receipt size={14} className="mr-1" /> Paid
                          </span>
                       )}
                    </td>
                 </tr>
               )) : (
                <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                        {isStudent ? "No payment records found." : "No fee records found."}
                    </td>
                </tr>
               )}
            </tbody>
          </table>
       </div>
    </div>
  );
};

const InfoIcon = () => (
  <svg className="w-4 h-4 inline-block mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default Fees;
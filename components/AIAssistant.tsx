import React, { useState, useEffect } from 'react';
import { generateAnnouncement, analyzeStudentPerformance } from '../services/geminiService';
import { Sparkles, Send, Copy, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { Student } from '../types';

const AIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ANNOUNCE' | 'ANALYZE'>('ANNOUNCE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  
  // Announcement State
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  
  // Analysis State
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [gradesInput, setGradesInput] = useState('Math: 85, Science: 72, English: 90, History: 88');

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await api.getStudents();
        setStudents(data);
        if (data.length > 0) {
            setSelectedStudentId(data[0].id);
        }
      } catch (e) {
        console.error("Failed to load students for AI Assistant");
      }
    };
    fetchStudents();
  }, []);

  const handleGenerateAnnouncement = async () => {
    if (!topic) return;
    setLoading(true);
    setResult('');
    const text = await generateAnnouncement(topic, tone);
    setResult(text);
    setLoading(false);
  };

  const handleAnalyzePerformance = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setResult('');
    const student = students.find(s => s.id === selectedStudentId);
    const text = await analyzeStudentPerformance(student?.name || 'Student', gradesInput);
    setResult(text);
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Sparkles className="text-indigo-600" />
          AI Assistant (Powered by Gemini)
        </h2>
        <p className="text-gray-500 mt-2">Automate tasks and get insights instantly.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { setActiveTab('ANNOUNCE'); setResult(''); }}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'ANNOUNCE' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Draft Announcement
          </button>
          <button
            onClick={() => { setActiveTab('ANALYZE'); setResult(''); }}
            className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
              activeTab === 'ANALYZE' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Analyze Performance
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'ANNOUNCE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., School closure due to snow, Science Fair next week"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option>Professional</option>
                  <option>Urgent</option>
                  <option>Friendly</option>
                  <option>Formal</option>
                </select>
              </div>
              <button
                onClick={handleGenerateAnnouncement}
                disabled={loading || !topic}
                className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Generating...' : <><Sparkles size={18} className="mr-2" /> Generate Draft</>}
              </button>
            </div>
          )}

          {activeTab === 'ANALYZE' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {students.length === 0 && <option>No students found...</option>}
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Grade {s.grade})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grades/Notes</label>
                <textarea
                  value={gradesInput}
                  onChange={(e) => setGradesInput(e.target.value)}
                  rows={3}
                  placeholder="Enter grades or observations here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAnalyzePerformance}
                disabled={loading || students.length === 0}
                className="w-full flex items-center justify-center py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Analyzing...' : <><Sparkles size={18} className="mr-2" /> Analyze Student</>}
              </button>
            </div>
          )}

          {/* Result Area */}
          {result && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">AI Result</h3>
                <button 
                  onClick={copyToClipboard}
                  className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center"
                >
                  {copied ? <Check size={14} className="mr-1"/> : <Copy size={14} className="mr-1"/>}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap shadow-sm">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
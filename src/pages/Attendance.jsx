import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-hot-toast';
import {
    ClipboardList,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Calendar,
    BookOpen,
    User,
    ChevronRight,
    Loader2,
    ArrowLeft,
    GraduationCap,
    Clock,
    Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubjects } from '../store/slices/subjectSlice';
import { getStudents } from '../store/slices/studentSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { submitAttendance, getStudentAttendance, getSubjectAttendance, reset } from '../store/slices/attendanceSlice';
import axios from 'axios';

const Attendance = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { subjects, isLoading: subjectsLoading } = useSelector((state) => state.subjects);
    const { departments, isLoading: departmentsLoading } = useSelector((state) => state.departments);
    const { students: allStudents, isLoading: studentsLoading } = useSelector((state) => state.students);
    const { isLoading: attendanceLoading, isSuccess, isError, message, studentHistory, subjectHistory } = useSelector((state) => state.attendance);

    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slot, setSlot] = useState('09:00 - 10:00');
    const [attendanceList, setAttendanceList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('mark'); // 'mark' or 'history'

    useEffect(() => {
        setSelectedSubject('');
    }, [selectedDepartment]);

    const filteredSubjects = subjects.filter(sub => {
        const depId = sub.department?._id || sub.department;
        return !selectedDepartment || depId === selectedDepartment;
    });

    const isAuthorized = ['admin', 'teacher', 'staff'].includes(user?.role);
    const isStudent = user?.role === 'student';

    useEffect(() => {
        dispatch(getSubjects());
        dispatch(getDepartments());
        if (isStudent && user?.studentId) {
            dispatch(getStudentAttendance(user.studentId));
        }
    }, [dispatch, isStudent, user]);

    // Fetch students when subject changes
    useEffect(() => {
        if (selectedSubject && isAuthorized) {
            dispatch(getStudents(`subjectId=${selectedSubject}`));
        } else {
            setAttendanceList([]);
        }
    }, [dispatch, selectedSubject, isAuthorized]);

    // Fetch history when subject changes or viewMode changes
    useEffect(() => {
        if (selectedSubject && viewMode === 'history' && isAuthorized) {
            dispatch(getSubjectAttendance(selectedSubject));
        }
    }, [dispatch, selectedSubject, viewMode, isAuthorized]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }
        if (isSuccess) {
            toast.success('Attendance submitted successfully!');
            dispatch(reset());
            setAttendanceList([]);
            setSelectedSubject('');
            // Optional: refresh history if in history mode
        }
    }, [isError, isSuccess, message, dispatch]);

    // Update attendance list when allStudents changes
    useEffect(() => {
        if (selectedSubject && Array.isArray(allStudents)) {
            setAttendanceList(allStudents.map(s => ({
                studentId: s._id,
                name: s.user?.name || 'N/A',
                registerNumber: s.registerNumber,
                status: 'Present'
            })));
        }
    }, [allStudents, selectedSubject]);

    const handleStatusToggle = (studentId) => {
        setAttendanceList(prev => prev.map(item => 
            item.studentId === studentId 
                ? { ...item, status: item.status === 'Present' ? 'Absent' : 'Present' }
                : item
        ));
    };

    const handleSubmit = () => {
        if (!selectedSubject) {
            toast.error('Please select a subject');
            return;
        }
        if (attendanceList.length === 0) {
            toast.error('No students found for this subject');
            return;
        }

        const data = {
            subjectId: selectedSubject,
            attendanceData: attendanceList,
            date,
            slot
        };

        dispatch(submitAttendance(data));
    };

    const filteredList = attendanceList.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registerNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isStudent) {
        const studentAttendance = user?.attendance || [];
        const totalPossible = studentAttendance.reduce((acc, curr) => acc + (curr.totalClasses || 0), 0);
        const totalAttended = studentAttendance.reduce((acc, curr) => acc + (curr.attendedClasses || 0), 0);
        const overallPercentage = totalPossible > 0 ? Math.round((totalAttended / totalPossible) * 100) : 0;

        return (
            <div className="p-6 md:p-8 space-y-8 animate-enter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-secondary-900 tracking-tight font-display">Academic Presence</h1>
                        <p className="text-secondary-500 font-medium">Monitoring your engagement across all modules</p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl border border-secondary-100 shadow-sm">
                         <span className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] block mb-1">Registration Node</span>
                         <span className="text-lg font-black text-primary-600 font-mono">{user?.registerNumber || 'UNASSIGNED'}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 glass-premium p-8 rounded-[2.5rem] border border-white/50 flex flex-col items-center justify-center text-center space-y-4 relative overflow-hidden bg-primary-600">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <ClipboardList size={80} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.3em] mb-2">Overall Score</p>
                            <h2 className="text-6xl font-black text-white">{overallPercentage}%</h2>
                            <div className="mt-4 px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
                                {overallPercentage >= 75 ? 'Optimal Status' : 'Attention Required'}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 glass-premium p-8 rounded-[2.5rem] border border-white/50 bg-white/40">
                        <h3 className="text-sm font-black text-secondary-900 uppercase tracking-widest mb-6">Subject Statistics</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {studentAttendance.length > 0 ? studentAttendance.map((item, idx) => (
                                <div key={idx} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="font-bold text-secondary-900 text-sm leading-none mb-1">{item.subject?.name}</p>
                                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{item.subject?.code}</p>
                                        </div>
                                        <span className={`text-sm font-black ${item.percentage >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.percentage}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-secondary-100 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${item.percentage}%` }}
                                            transition={{ duration: 1, delay: idx * 0.1 }}
                                            className={`h-full rounded-full ${item.percentage >= 75 ? 'bg-green-500' : 'bg-red-500'}`}
                                        />
                                    </div>
                                    <p className="text-[10px] font-bold text-secondary-400 flex justify-between">
                                        <span>Attended: {item.attendedClasses}</span>
                                        <span>Total: {item.totalClasses}</span>
                                    </p>
                                </div>
                            )) : (
                                <div className="col-span-2 py-10 text-center opacity-40 italic text-sm">
                                    No subject data synchronized yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="glass-premium rounded-[2.5rem] overflow-hidden border border-white/50 shadow-premium">
                    <div className="p-8 border-b border-secondary-100 flex items-center justify-between bg-white/50 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-secondary-900 text-white flex items-center justify-center">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-secondary-900">Engagement Logs</h3>
                                <p className="text-xs font-bold text-secondary-400 uppercase tracking-widest mt-0.5">Your detailed session history</p>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-secondary-50/50">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Timestamp</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Subject / Code</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Faculty</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary-100 bg-white">
                                {studentHistory.length > 0 ? studentHistory.map((record) => (
                                    <tr key={record._id} className="hover:bg-secondary-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-secondary-900">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            <p className="text-[10px] text-secondary-400 font-black uppercase tracking-widest">{record.slot}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="font-bold text-secondary-900">{record.subject?.name}</p>
                                            <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{record.subject?.code}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 rounded-lg bg-secondary-100 flex items-center justify-center text-[10px] font-black text-secondary-500">
                                                     {record.faculty?.name?.charAt(0)}
                                                 </div>
                                                 <span className="text-sm font-bold text-secondary-600">{record.faculty?.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                record.status === 'Present' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'
                                            }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="4" className="px-8 py-24 text-center">
                                            <div className="flex flex-col items-center gap-4 opacity-30">
                                                <div className="w-20 h-20 rounded-[2rem] bg-secondary-50 flex items-center justify-center">
                                                    <Search size={32} />
                                                </div>
                                                <p className="text-secondary-900 font-black text-base uppercase tracking-widest">No Logs Found</p>
                                                <p className="text-secondary-500 text-xs font-medium">Your attendance records will appear here once they are submitted by faculty.</p>
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
    }

    return (
        <div className="p-6 md:p-8 space-y-8 animate-enter">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-secondary-900 tracking-tight font-display">Manage Attendance</h1>
                    <p className="text-secondary-500 font-medium">Record and track student participation</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setViewMode('mark')}
                        className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${
                            viewMode === 'mark' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-secondary-600 border border-secondary-100'
                        }`}
                    >
                        Mark New
                    </button>
                    <button 
                         onClick={() => setViewMode('history')}
                         className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${
                             viewMode === 'history' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-secondary-600 border border-secondary-100'
                         }`}
                    >
                        View History
                    </button>
                </div>
            </div>

            {viewMode === 'mark' ? (
                <div className="flex flex-col md:flex-row gap-6 md:items-start">
                    {/* Left Sidebar: Programmes Navigator */}
                    <aside className="w-full md:w-72 lg:w-80 flex-shrink-0 md:sticky md:top-8">
                        <div className="glass-premium p-5 rounded-[2rem] bg-white border border-secondary-100 shadow-premium">
                            <div className="flex items-center gap-3 mb-6 px-2">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                                    <GraduationCap size={20} />
                                </div>
                                <h3 className="text-lg font-black text-secondary-900 tracking-tight">Programmes</h3>
                            </div>
                            
                            <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1 custom-scrollbar">
                                {departments.map((dep) => (
                                    <button
                                        key={dep._id}
                                        onClick={() => setSelectedDepartment(dep._id)}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl font-bold transition-all flex items-center justify-between group ${
                                            selectedDepartment === dep._id
                                                ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20'
                                                : 'bg-transparent text-secondary-500 hover:bg-secondary-50 border border-transparent'
                                        }`}
                                    >
                                        <div className="flex flex-col truncate">
                                            <span className="truncate text-sm">{dep.programme || dep.name}</span>
                                            {dep.code && (
                                                <span className={`text-[10px] font-medium ${selectedDepartment === dep._id ? 'text-primary-100' : 'text-secondary-400'}`}>
                                                    {dep.code}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight 
                                            size={16} 
                                            className={`transition-all ${selectedDepartment === dep._id ? 'translate-x-1 opacity-100' : 'opacity-0 -translate-x-2'}`} 
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Right Side: Primary Content Area */}
                    <div className="flex-1 w-full space-y-6">
                        {/* Status/Filters Bar */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-5 rounded-[2rem] border border-secondary-100 shadow-sm">
                            <div className="space-y-1.5 px-1">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Subject</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                        <BookOpen size={17} />
                                    </span>
                                    <select
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-secondary-50/50 border border-secondary-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 transition-all font-medium text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Subject</option>
                                        {filteredSubjects.map(subject => (
                                            <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Date</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                        <Calendar size={17} />
                                    </span>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-secondary-50/50 border border-secondary-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 px-1">
                                <label className="text-[10px] font-black text-secondary-400 uppercase tracking-widest ml-1">Time Slot</label>
                                <div className="relative group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400 group-focus-within:text-primary-600 transition-colors">
                                        <Clock size={17} />
                                    </span>
                                    <select
                                        value={slot}
                                        onChange={(e) => setSlot(e.target.value)}
                                        className="w-full pl-11 pr-4 py-2.5 bg-secondary-50/50 border border-secondary-100 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 transition-all font-medium text-sm cursor-pointer appearance-none"
                                    >
                                        <option>09:00 - 10:00</option>
                                        <option>10:00 - 11:00</option>
                                        <option>11:15 - 12:15</option>
                                        <option>12:15 - 01:15</option>
                                        <option>02:00 - 03:00</option>
                                        <option>03:00 - 04:00</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-end px-1">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={attendanceLoading || attendanceList.length === 0}
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {attendanceLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                    <span>Submit</span>
                                </button>
                            </div>
                        </div>

                        {/* Main Student Roster Card */}
                        <div className="glass-premium rounded-[2rem] bg-white border border-secondary-100 shadow-premium overflow-hidden">
                            <div className="p-6 md:p-8 border-b border-secondary-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white/80 backdrop-blur-xl">
                                <div>
                                    <h2 className="text-xl font-extra-black text-secondary-900 tracking-tight">Student Roster</h2>
                                    <p className="text-secondary-400 font-bold text-xs uppercase tracking-wider mt-0.5">
                                        {selectedSubject ? 'Mark participation for enrolled students' : 'Select a subject to load roster'}
                                    </p>
                                </div>
                                
                                {selectedSubject && (
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Quick student lookup..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-11 pr-4 py-3 bg-secondary-50/50 border border-secondary-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-600/5 focus:border-primary-600/30 transition-all font-medium text-sm"
                                        />
                                    </div>
                                )}
                            </div>

                            {selectedSubject ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-secondary-50/50">
                                            <tr>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-400">Student Info</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-400">Reg. Number</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-400 text-center">Current Status</th>
                                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-secondary-400 text-right">Quick Mark</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary-100 bg-white">
                                            {studentsLoading ? (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4">
                                                            <Loader2 size={32} className="text-primary-600 animate-spin" />
                                                            <p className="text-secondary-500 font-black text-sm uppercase tracking-widest">Refreshing Data...</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredList.length > 0 ? (
                                                <AnimatePresence mode='popLayout'>
                                                    {filteredList.map((student) => (
                                                        <motion.tr 
                                                            layout
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            key={student.studentId} 
                                                            className="group hover:bg-primary-50/30 transition-all cursor-pointer"
                                                            onClick={() => handleStatusToggle(student.studentId)}
                                                        >
                                                            <td className="px-8 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center text-secondary-500 font-black text-xs group-hover:bg-white transition-all shadow-sm">
                                                                        {student.name.charAt(0)}
                                                                    </div>
                                                                    <p className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight text-sm">{student.name}</p>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <span className="font-mono font-black text-secondary-600 text-[11px] py-1 px-2.5 bg-secondary-50 rounded-lg border border-secondary-100 group-hover:bg-white transition-all">
                                                                    {student.registerNumber}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-4">
                                                                <div className="flex justify-center">
                                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-all border ${
                                                                        student.status === 'Present' 
                                                                            ? 'bg-green-100 text-green-600 border-green-200' 
                                                                            : 'bg-red-100 text-red-600 border-red-200'
                                                                    }`}>
                                                                        {student.status}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <div className={`p-2 rounded-lg transition-all shadow-sm ${student.status === 'Present' ? 'bg-green-600 text-white' : 'bg-secondary-50 text-secondary-300'}`}>
                                                                        <CheckCircle2 size={16} />
                                                                    </div>
                                                                    <div className={`p-2 rounded-lg transition-all shadow-sm ${student.status === 'Absent' ? 'bg-red-600 text-white' : 'bg-secondary-50 text-secondary-300'}`}>
                                                                        <XCircle size={16} />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            ) : (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-4 opacity-50">
                                                            <div className="w-16 h-16 rounded-3xl bg-secondary-50 flex items-center justify-center text-secondary-400">
                                                                <User size={32} />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <p className="text-secondary-900 font-black text-base">Roster Empty</p>
                                                                <p className="text-secondary-500 text-xs max-w-[280px] font-medium">No students are currently enrolled in this subject.</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-28 flex flex-col items-center justify-center text-center px-8">
                                    <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-[2rem] flex items-center justify-center mb-6 animate-pulse shadow-inner">
                                        <BookOpen size={32} />
                                    </div>
                                    <h3 className="text-xl font-black text-secondary-900 mb-2">Subject Selection Required</h3>
                                    <p className="text-secondary-500 max-w-xs font-medium text-sm leading-relaxed">Please select a subject from the controls above to load the student roster for today's session.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="glass-premium p-5 rounded-[2rem] bg-white border border-secondary-100 shadow-sm flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <BookOpen className="text-primary-600" size={24} />
                             <select
                                value={selectedSubject}
                                onChange={(e) => setSelectedSubject(e.target.value)}
                                className="bg-transparent border-none font-bold text-secondary-900 focus:ring-0 cursor-pointer text-lg"
                            >
                                <option value="">Select Subject to View History</option>
                                {subjects.map(subject => (
                                    <option key={subject._id} value={subject._id}>{subject.name} ({subject.code})</option>
                                ))}
                            </select>
                         </div>
                    </div>

                    <div className="glass-premium rounded-[2.5rem] bg-white border border-secondary-100 shadow-premium overflow-hidden">
                        {selectedSubject ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-secondary-50/50">
                                        <tr>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Session Date</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Time Slot</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Total Students</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Present</th>
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400">Attendance %</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100">
                                        {subjectHistory.map((record) => {
                                            const total = record.students?.length || 0;
                                            const present = record.students?.filter(s => s.status === 'Present').length || 0;
                                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
                                            
                                            return (
                                                <tr key={record._id} className="hover:bg-secondary-50/30 transition-colors">
                                                    <td className="px-8 py-5 font-bold text-secondary-900">
                                                        {new Date(record.date).toLocaleDateString(undefined, {
                                                            weekday: 'short',
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-bold border border-primary-100">
                                                            {record.slot}
                                                        </span>
                                                    </td>
                                                    <td className="px-8 py-5 text-secondary-600 font-medium">{total} Students</td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-green-600 font-bold">{present} Present</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 w-24 h-2 bg-secondary-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full transition-all duration-1000 ${
                                                                        percentage > 75 ? 'bg-green-500' : 
                                                                        percentage > 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                    }`} 
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-black text-secondary-900 text-sm">{percentage}%</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {subjectHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-50">
                                                        <Calendar size={40} className="text-secondary-300" />
                                                        <p className="text-secondary-900 font-black text-base">No History Records</p>
                                                        <p className="text-secondary-500 text-xs font-medium">No attendance has been recorded for this subject yet.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-32 flex flex-col items-center justify-center text-center px-10">
                                <div className="w-20 h-20 bg-secondary-50 text-secondary-300 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                                    <Filter size={32} />
                                </div>
                                <h3 className="text-xl font-black text-secondary-900 mb-2">History Filter Inactive</h3>
                                <p className="text-secondary-500 max-w-xs font-medium text-sm leading-relaxed">Select a subject from the dropdown above to retrieve all previous attendance logs for that course.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Attendance;

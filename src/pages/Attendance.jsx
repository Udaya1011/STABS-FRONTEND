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
    Save,
    Eye,
    ChevronLeft
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

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [slot, setSlot] = useState('09:00 - 10:00');
    const [attendanceList, setAttendanceList] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('mark'); // 'mark' or 'history'
    const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Clear dependent states when high-level config changes
    useEffect(() => {
        setSelectedSubject('');
    }, [selectedClass, selectedYear, selectedSemester]);

    useEffect(() => {
        console.log('--- Attendance State Log ---');
        console.log('View:', viewMode);
        console.log('Selection:', { selectedClass, selectedYear, selectedSemester, selectedSubject });
    }, [viewMode, selectedClass, selectedYear, selectedSemester, selectedSubject]);

    const filteredSubjects = subjects.filter(sub => {
        const depId = sub.department?._id || sub.department;
        const depMatch = !selectedClass || depId === selectedClass;
        const semMatch = !selectedSemester || String(sub.semester) === String(selectedSemester);
        const yearMatch = !selectedYear || String(sub.year) === String(selectedYear);
        return depMatch && semMatch && yearMatch;
    });

    const markAll = (status) => {
        setAttendanceList(prev => prev.map(item => ({ ...item, status })));
        toast.success(`Marked all as ${status}`);
    };

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
            const queryParts = [`subjectId=${selectedSubject}`];
            if (selectedClass) queryParts.push(`department=${selectedClass}`);
            if (selectedYear) queryParts.push(`year=${selectedYear}`);
            if (selectedSemester) queryParts.push(`semester=${selectedSemester}`);

            const fullQuery = queryParts.join('&');
            console.log('Dispatching getStudents with query:', fullQuery);
            dispatch(getStudents(fullQuery));
        } else {
            console.log('Clearing selection or unauthorized - ignoring student fetch');
            setAttendanceList([]);
        }
    }, [dispatch, selectedSubject, isAuthorized, selectedClass, selectedYear, selectedSemester]);

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

    // Clear roster ONLY when subject selection is actually cleared, not just during loading
    useEffect(() => {
        if (!selectedSubject) {
            setAttendanceList([]);
        }
    }, [selectedSubject]);

    // Update attendance list when allStudents changes
    useEffect(() => {
        if (selectedSubject && Array.isArray(allStudents) && allStudents.length > 0) {
            console.log('Mapping Students to Roster:', allStudents.length);
            const roster = allStudents.map(s => ({
                studentId: s._id,
                name: s.user?.name || s.name || 'Unknown Student',
                registerNumber: s.registerNumber || 'NO-REG',
                status: 'Present'
            }));
            setAttendanceList(roster);
        } else if (selectedSubject && Array.isArray(allStudents) && allStudents.length === 0 && !studentsLoading) {
            // Only set to empty if loading is finished and result is truly 0
            setAttendanceList([]);
        }
    }, [allStudents, selectedSubject, studentsLoading]);

    const handleStatusToggle = (studentId, status) => {
        setAttendanceList(prev => prev.map(item =>
            item.studentId === studentId
                ? { ...item, status }
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
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${record.status === 'Present' ? 'bg-green-100 text-green-600 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'
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
                        className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${viewMode === 'mark' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-secondary-600 border border-secondary-100'
                            }`}
                    >
                        Mark New
                    </button>
                    <button
                        onClick={() => setViewMode('history')}
                        className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${viewMode === 'history' ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-secondary-600 border border-secondary-100'
                            }`}
                    >
                        View History
                    </button>
                </div>
            </div>

            {viewMode === 'mark' ? (
                <div className="space-y-8 animate-enter">
                    {/* Selection Console */}
                    <div className="glass-premium p-8 rounded-[2.5rem] bg-white border border-secondary-100 shadow-premium space-y-8">
                        <div className="flex items-center gap-4 border-b border-secondary-50 pb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-secondary-900 leading-none">Context Selection</h2>
                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-[0.2em] mt-2">Configure academic parameters for the session</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                            {/* Class & Subject */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Class</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {departments.map((dep) => (
                                            <button
                                                key={dep._id}
                                                onClick={() => setSelectedClass(dep._id)}
                                                className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border-2 text-center ${selectedClass === dep._id
                                                        ? 'bg-secondary-900 border-secondary-900 text-white shadow-xl scale-[1.05]'
                                                        : 'bg-white border-secondary-50 text-secondary-400 hover:border-secondary-100'
                                                    }`}
                                            >
                                                {dep.programme ? `${dep.programme} ${dep.name} ${Array.isArray(dep.className) ? dep.className.join(' ') : (dep.className || '')}`.trim() : dep.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Active Subject</label>
                                    <div className="relative group">
                                        <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full h-14 pl-12 pr-4 bg-secondary-50/50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl transition-all font-black text-secondary-800 text-xs uppercase appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Domain Module</option>
                                            {filteredSubjects.map(sub => (
                                                <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Academic Scope */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Academic Year</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4].map(year => (
                                            <button
                                                key={year}
                                                onClick={() => setSelectedYear(String(year))}
                                                className={`px-6 py-2.5 rounded-xl font-bold transition-all border-2 ${selectedYear === String(year)
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                                                        : 'bg-white border-secondary-50 text-secondary-400 hover:border-primary-200 hover:text-primary-600'
                                                    }`}
                                            >
                                                Year {year}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Semester Cycle</label>
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                            <button
                                                key={sem}
                                                onClick={() => setSelectedSemester(String(sem))}
                                                className={`w-11 h-11 rounded-xl font-black transition-all border-2 text-sm ${selectedSemester === String(sem)
                                                        ? 'bg-primary-600 border-primary-600 text-white shadow-lg'
                                                        : 'bg-white border-secondary-50 text-secondary-400 hover:border-primary-200'
                                                    }`}
                                            >
                                                {sem}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Date & Slot */}
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Session Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                        <input
                                            type="date"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full h-14 pl-12 pr-10 bg-secondary-50/50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl transition-all font-black text-secondary-900"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-secondary-500 uppercase tracking-widest ml-1">Time Block</label>
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                        <select
                                            value={slot}
                                            onChange={(e) => setSlot(e.target.value)}
                                            className="w-full h-14 pl-12 pr-10 bg-secondary-50/50 border-2 border-transparent focus:border-primary-600 focus:bg-white rounded-2xl transition-all font-black text-secondary-900 text-xs uppercase appearance-none cursor-pointer"
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
                            </div>
                        </div>
                    </div>

                    {/* Student Roster Section */}
                    {selectedSubject && (
                        <div className="space-y-6 anim-enter">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-3xl border border-secondary-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-secondary-900 tracking-tight leading-none">Verification Roster</h3>
                                        <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-1.5">{attendanceList.length} Students Synchronized</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button onClick={() => markAll('Present')} className="px-5 py-2.5 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all">Mark All Present</button>
                                    <button onClick={() => markAll('Absent')} className="px-5 py-2.5 bg-red-50 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all">Mark All Absent</button>
                                    <div className="w-px h-10 bg-secondary-100 mx-2"></div>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={attendanceLoading}
                                        className="px-8 py-3 bg-primary-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center gap-2"
                                    >
                                        {attendanceLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                        Submit Engagement
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-[2.5rem] border border-secondary-100 shadow-premium overflow-hidden">
                                <div className="p-8 border-b border-secondary-50 bg-secondary-50/30 flex items-center justify-between">
                                    <div className="relative flex-1 max-w-md">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                                        <input
                                            type="text"
                                            placeholder="Search active identity..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-white border border-secondary-100 rounded-2xl focus:ring-4 focus:ring-primary-500/10 transition-all font-bold text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-6 py-2 bg-secondary-50 rounded-xl text-center">
                                            <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Present</p>
                                            <p className="text-base font-black text-green-600">{attendanceList.filter(a => a.status === 'Present').length}</p>
                                        </div>
                                        <div className="px-6 py-2 bg-secondary-50 rounded-xl text-center">
                                            <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Absent</p>
                                            <p className="text-base font-black text-red-600">{attendanceList.filter(a => a.status === 'Absent').length}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-secondary-50/50">
                                                <th className="px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Student Information</th>
                                                <th className="px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest">Registry ID</th>
                                                <th className="px-10 py-5 text-[10px] font-black text-secondary-400 uppercase tracking-widest text-center">Visual Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-secondary-50">
                                            {studentsLoading ? (
                                                <tr>
                                                    <td colSpan="3" className="px-10 py-24 text-center">
                                                        <Loader2 size={32} className="text-primary-600 animate-spin mx-auto mb-3" />
                                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Synchronizing Student Data...</p>
                                                    </td>
                                                </tr>
                                            ) : filteredList.length > 0 ? (
                                                filteredList.map((student) => (
                                                    <tr
                                                        key={student.studentId}
                                                        className="group hover:bg-primary-50/30 transition-all"
                                                    >
                                                        <td className="px-10 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all ${student.status === 'Present' ? 'bg-green-100 text-green-700 shadow-sm' : 'bg-red-50 text-red-400'}`}>
                                                                    {student.name.charAt(0)}
                                                                </div>
                                                                <span className="font-black text-secondary-800 uppercase tracking-tight text-sm tracking-tighter">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-10 py-5">
                                                            <span className="font-mono font-black text-secondary-500 bg-secondary-50 px-4 py-2 rounded-xl border border-secondary-100 text-[11px]">
                                                                {student.registerNumber}
                                                            </span>
                                                        </td>
                                                        <td className="px-10 py-5">
                                                            <div className="flex justify-center gap-3">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusToggle(student.studentId, 'Present'); }}
                                                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${student.status === 'Present'
                                                                            ? 'bg-green-500 text-white border-green-600 shadow-lg shadow-green-500/30'
                                                                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                                                                        }`}
                                                                >
                                                                    <CheckCircle2 size={14} />
                                                                    Present
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStatusToggle(student.studentId, 'Absent'); }}
                                                                    className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all border-2 ${student.status === 'Absent'
                                                                            ? 'bg-red-500 text-white border-red-600 shadow-lg shadow-red-500/30'
                                                                            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                                        }`}
                                                                >
                                                                    <XCircle size={14} />
                                                                    Absent
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="3" className="px-10 py-24 text-center">
                                                        <div className="opacity-30 flex flex-col items-center">
                                                            <User size={48} className="mb-4 text-secondary-300" />
                                                            <p className="text-secondary-900 font-extrabold text-sm uppercase tracking-widest">No Active Enrollment Found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
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
                                            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-secondary-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-secondary-100">
                                        {subjectHistory.map((record) => {
                                            const total = record.students?.length || 0;
                                            const present = record.students?.filter(s => s.status === 'Present').length || 0;
                                            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                                            return (
                                                <tr key={record._id} className="hover:bg-secondary-50/30 transition-colors group">
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
                                                                    className={`h-full rounded-full transition-all duration-1000 ${percentage > 75 ? 'bg-green-500' :
                                                                            percentage > 50 ? 'bg-amber-500' : 'bg-red-500'
                                                                        }`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="font-black text-secondary-900 text-sm">{percentage}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedDetailRecord(record);
                                                                setShowDetailModal(true);
                                                            }}
                                                            className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-600 hover:text-white rounded-lg transition-all border border-primary-100 shadow-sm"
                                                            title="View Roster"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {subjectHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-20 text-center">
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

            {/* Detailed History Modal */}
            <AnimatePresence>
                {showDetailModal && selectedDetailRecord && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDetailModal(false)}
                            className="absolute inset-0 bg-secondary-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] border border-secondary-100"
                        >
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                        <ClipboardList size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-secondary-900 uppercase">Session Roster</h3>
                                        <p className="text-xs font-bold text-secondary-400">
                                            {new Date(selectedDetailRecord.date).toLocaleDateString()} at {selectedDetailRecord.slot}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowDetailModal(false)} className="text-secondary-400 hover:text-secondary-900 font-bold uppercase text-xs">✕</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-2">
                                {selectedDetailRecord.students?.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 bg-white border border-secondary-50 rounded-2xl hover:bg-secondary-50/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs">
                                                {item.student?.user?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-secondary-900">{item.student?.user?.name || 'Academic Record'}</p>
                                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">{item.student?.registerNumber}</p>
                                            </div>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${item.status === 'Present'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-red-100 text-red-700 border border-red-200'
                                            }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="px-8 py-6 bg-secondary-50 border-t border-secondary-100 flex justify-end">
                                <button onClick={() => setShowDetailModal(false)} className="px-8 py-3 bg-secondary-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg">Close Details</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Attendance;

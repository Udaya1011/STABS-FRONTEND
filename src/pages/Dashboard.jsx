import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    Users,
    Calendar,
    BookOpen,
    Clock,
    TrendingUp,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    ArrowRight,
    Building2,
    GraduationCap,
    Plus,
    X,
    Save,
    ClipboardList,
    RefreshCcw,
    Loader2,
    User,
    Sparkles,
    ExternalLink,
    Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudents } from '../store/slices/studentSlice';
import { getTeachers, getMyProfile, updateMyAvailability, syncMyFreeSlots } from '../store/slices/teacherSlice';
import { getSubjects } from '../store/slices/subjectSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { getMyAppointments, updateAppointmentStatus } from '../store/slices/appointmentSlice';
import { getStudentAttendance } from '../store/slices/attendanceSlice';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { students } = useSelector((state) => state.students);
    const { teachers, currentTeacherProfile } = useSelector((state) => state.teachers);
    const { subjects } = useSelector((state) => state.subjects);
    const { departments } = useSelector((state) => state.departments);
    const { appointments } = useSelector((state) => state.appointments);
    const { studentHistory } = useSelector((state) => state.attendance);

    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [statsModal, setStatsModal] = useState({ isOpen: false, type: null, title: '' });
    const [timetable, setTimetable] = useState([]);

    const generateEmptySchedule = () => {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const defaultTimes = [
            { start: '09:00', end: '09:50' },
            { start: '09:50', end: '10:40' },
            { start: '10:50', end: '11:40' },
            { start: '11:40', end: '12:30' },
            { start: '13:30', end: '14:20' },
            { start: '14:20', end: '15:10' }
        ];
        return days.map(day => ({
            day,
            slots: defaultTimes.map(time => ({ ...time, isBooked: false, subject: '' }))
        }));
    };

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'teacher') {
            dispatch(getStudents());
        }
        dispatch(getTeachers());
        dispatch(getSubjects());
        dispatch(getDepartments());
        dispatch(getMyAppointments());

        if (user?.role === 'teacher') {
            dispatch(getMyProfile());
            dispatch(syncMyFreeSlots()).then(() => {
                dispatch(getMyAppointments());
            });
        }

        if (user?.role === 'student' && user?._id) {
            dispatch(getStudentAttendance(user._id));
        }
    }, [dispatch, user]);

    const handleOpenTimetableModal = () => {
        if (!currentTeacherProfile) {
            toast.error('Teacher profile not loaded yet');
            return;
        }
        setTimetable(currentTeacherProfile.availability?.length > 0
            ? JSON.parse(JSON.stringify(currentTeacherProfile.availability))
            : generateEmptySchedule()
        );
        setShowTimetableModal(true);
    };

    const handleSaveTimetable = async (e) => {
        e.preventDefault();
        try {
            const cleanedTimetable = timetable.map(day => ({
                ...day,
                slots: day.slots.map(slot => ({
                    ...slot,
                    subject: slot.subject === '' ? null : slot.subject
                }))
            }));

            await dispatch(updateMyAvailability(cleanedTimetable)).unwrap();
            toast.success('Timetable updated successfully!');
            setShowTimetableModal(false);
        } catch (error) {
            toast.error(error || 'Failed to update timetable');
        }
    };

    const handleTimeChange = (dayIndex, slotIndex, type, value) => {
        setTimetable(prev => {
            const newTimetable = JSON.parse(JSON.stringify(prev));
            newTimetable[dayIndex].slots[slotIndex][type] = value;
            return newTimetable;
        });
    };

    const stats = [
        { id: 'students', name: 'Active Students', value: students.length, icon: GraduationCap, color: 'text-primary-600', bgColor: 'bg-primary-50', trend: 'Live', trendUp: true, data: students, roles: ['admin', 'teacher'] },
        { id: 'teachers', name: 'Faculty Staff', value: teachers.length, icon: Users, color: 'text-accent-purple', bgColor: 'bg-purple-50', trend: 'Verified', trendUp: true, data: teachers, roles: ['admin', 'student', 'teacher'] },
        { id: 'subjects', name: 'Active Subjects', value: subjects.length, icon: BookOpen, color: 'text-accent-blue', bgColor: 'bg-blue-50', trend: 'Synced', trendUp: true, roles: ['admin', 'student', 'teacher'], data: subjects },
        { id: 'departments', name: 'Programmes', value: departments.length, icon: Building2, color: 'text-amber-600', bgColor: 'bg-amber-50', trend: 'Global', trendUp: true, roles: ['admin', 'student', 'teacher'], data: departments },
    ].filter(stat => !stat.roles || stat.roles.includes(user?.role));

    const upcomingAppointments = [...appointments]
        .filter(a => a.status === 'pending' || a.status === 'approved')
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    const handleUpdateStatus = (id, status) => {
        dispatch(updateAppointmentStatus({ id, statusData: { status } }))
            .unwrap()
            .then(() => toast.success(`Appointment ${status}`))
            .catch(err => toast.error(err));
    };

    const navigate = useNavigate();

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    const attendanceStats = (() => {
        const total = studentHistory?.length || 0;
        const present = studentHistory?.filter(r => r.status === 'present').length || 0;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
        return { total, present, percentage };
    })();

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20 px-2 lg:px-4">
            {/* Header Section - TRIPARTITE LAYOUT (LEFT, CENTER, RIGHT) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 items-center gap-8 border-b border-secondary-100 pb-10">

                    {/* 1. LEFT: Greeting & Role Node */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex flex-col items-start gap-1"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="px-3 py-1 bg-secondary-900 rounded-xl border border-black shadow-2xl">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.25em] whitespace-nowrap">
                                        {user?.role} NODE
                                    </span>
                                </div>
                            </div>
                            <span className="h-4 w-[1px] bg-secondary-200"></span>
                            <span className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest leading-none">Status: Online</span>
                        </div>
                        <h1 className="text-4xl font-black text-secondary-900 tracking-tighter leading-tight">
                            {getGreeting()},<br />
                            <span className="text-primary-600">{user?.name?.split(' ')[0]}</span>
                        </h1>
                    </motion.div>

                    {/* 2. CENTER: Micro Stat Cards */}
                    <div className="flex justify-center items-center">
                        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2">
                            {stats.map((stat, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 + (idx * 0.1) }}
                                    key={stat.id}
                                    onClick={() => setStatsModal({ isOpen: true, type: stat.id, title: stat.name, data: stat.data })}
                                    className="px-5 py-3 bg-white rounded-2xl border border-secondary-100 shadow-sm hover:border-primary-600 hover:shadow-xl hover:shadow-primary-500/5 transition-all cursor-pointer group flex items-center gap-4 min-w-[130px] shrink-0"
                                >
                                    <div className={`${stat.bgColor} ${stat.color} p-2.5 rounded-xl group-hover:bg-primary-600 group-hover:text-white transition-all transform group-hover:rotate-12`}>
                                        <stat.icon size={16} />
                                    </div>
                                    <div className="leading-tight">
                                        <p className="text-[8px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-1">{stat.name.split(' ')[1] || stat.name}</p>
                                        <p className="text-lg font-black text-secondary-900 tracking-tight">{stat.value}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* 3. RIGHT: Rapid Action Hub */}
                    <div className="flex items-center justify-end gap-3 shrink-0">
                        <div className="h-10 w-[1px] bg-secondary-100 mx-4 hidden xl:block"></div>

                        {user?.role === 'teacher' && (
                            <button
                                onClick={() => navigate('/attendance')}
                                className="group bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center gap-3 shadow-[0_15px_30px_-5px_rgba(235,50,50,0.3)] active:scale-95 transition-all"
                            >
                                <ClipboardList size={18} />
                                <span className="hidden lg:block">Log Entry</span>
                            </button>
                        )}

                        {user?.role === 'student' && (
                            <button
                                onClick={() => navigate('/teachers')}
                                className="group bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.25em] flex items-center gap-3 shadow-[0_15px_30px_-5px_rgba(235,50,50,0.3)] active:scale-95 transition-all"
                            >
                                <User size={18} />
                                <span className="hidden lg:block">Consult Node</span>
                            </button>
                        )}

                        {user?.role === 'teacher' && (
                            <button
                                onClick={handleOpenTimetableModal}
                                className="group bg-white border-2 border-secondary-100 text-secondary-900 p-4 rounded-2xl hover:border-primary-600 hover:text-primary-600 hover:shadow-lg transition-all active:scale-95"
                                title="Matrix Schedule"
                            >
                                <Calendar size={18} />
                            </button>
                        )}
                </div>
            </div>

            {/* Main Content Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* LARGE SECTION (2/3): Timeline & Operations */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Academic Timeline Node */}
                    <div className="card-premium group">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary-100 text-primary-600 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                    <Calendar size={22} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] leading-none mb-1">Matrix Schedule</p>
                                    <h3 className="text-xl font-black text-secondary-900 uppercase tracking-tight">Academic Timeline</h3>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {upcomingAppointments.length > 0 ? upcomingAppointments.map((app) => (
                                <div key={app._id} className="flex flex-wrap sm:flex-nowrap items-center gap-4 p-4 rounded-3xl border border-secondary-50 bg-secondary-50/30 hover:bg-white hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group/item">
                                    <div className="flex flex-col items-center justify-center w-full sm:w-20 py-2 px-3 bg-white rounded-2xl shadow-sm border border-secondary-100 group-hover/item:border-primary-100">
                                        <span className="text-[10px] font-black text-secondary-400 uppercase">{new Date(app.date).toLocaleDateString([], { month: 'short' })}</span>
                                        <span className="text-xl font-black text-secondary-900 leading-none">{new Date(app.date).toLocaleDateString([], { day: '2-digit' })}</span>
                                    </div>
                                    <div className="flex-1 min-w-[150px]">
                                        <h4 className="font-black text-secondary-800 text-xs uppercase tracking-tight line-clamp-1">{app.reason || 'Academic Consultation'}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                                            <p className="text-[9px] font-bold text-secondary-500 uppercase tracking-widest leading-none">
                                                {user.role === 'teacher' ? `Student: ${app.student?.name || 'User'}` : `Faculty: ${app.teacher?.name || 'Staff'}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full sm:w-auto flex justify-end">
                                        {user.role === 'teacher' && app.status === 'pending' ? (
                                            <button
                                                onClick={() => handleUpdateStatus(app._id, 'approved')}
                                                className="px-8 py-3 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 active:scale-95 whitespace-nowrap"
                                            >
                                                Authorize
                                            </button>
                                        ) : (
                                            <div className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border ${app.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                <div className={`w-1 h-1 rounded-full ${app.status === 'approved' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                                {app.status}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )) : (
                                <div className="py-16 text-center bg-secondary-50/50 rounded-[2.5rem] border border-dashed border-secondary-200">
                                    <Calendar className="mx-auto text-secondary-200 mb-4 opacity-50" size={48} />
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.3em]">No Active Sessions Detected</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operation Nodes Card (Black Box) */}
                    <div className="card-premium bg-gradient-to-br from-secondary-900 to-black text-white border-none relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-[100px] rounded-full -mr-32 -mt-32"></div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-primary-500 uppercase tracking-[0.3em] mb-1">Fast Execution</p>
                            <h3 className="text-xl font-black mb-8 uppercase tracking-tight">Operation Nodes</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <button
                                    onClick={() => navigate('/chat')}
                                    className="p-5 bg-white/5 hover:bg-primary-600 rounded-3xl border border-white/10 transition-all duration-300 group/btn flex items-center gap-5"
                                >
                                    <div className="p-3 bg-white/10 rounded-2xl group-hover/btn:bg-white group-hover/btn:text-primary-600 transition-colors">
                                        <Clock size={22} />
                                    </div>
                                    <div className="text-left leading-none">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 group-hover/btn:text-white transition-colors">Request</p>
                                        <p className="text-sm font-black uppercase tracking-tighter mt-1">Leave Node</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="p-5 bg-white/5 hover:bg-white/10 rounded-3xl border border-white/10 transition-all duration-300 group/btn flex items-center gap-5"
                                >
                                    <div className="p-3 bg-white/10 rounded-2xl group-hover/btn:bg-primary-600 transition-colors">
                                        <User size={22} />
                                    </div>
                                    <div className="text-left leading-none">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-secondary-400 group-hover/btn:text-white transition-colors">Identity</p>
                                        <p className="text-sm font-black uppercase tracking-tighter mt-1">Matrix Profile</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {user?.role === 'student' && (
                        <div className="card-premium border-t-8 border-emerald-500 group overflow-hidden relative h-full">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Academic Integrity</h3>
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Live Stability Metrics</p>
                                </div>
                                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                    <TrendingUp size={20} />
                                </div>
                            </div>

                            <div className="relative flex justify-center py-6">
                                <svg className="w-48 h-48 sm:w-64 sm:h-64 transform -rotate-90 drop-shadow-2xl overflow-visible" viewBox="0 0 208 208">
                                    <defs>
                                        <linearGradient id="gradientIntegrity" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#10b981" />
                                            <stop offset="100%" stopColor="#059669" />
                                        </linearGradient>
                                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                            <feGaussianBlur stdDeviation="3" result="blur" />
                                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                        </filter>
                                    </defs>
                                    <circle
                                        cx="104"
                                        cy="104"
                                        r="80"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-secondary-100"
                                    />
                                    <motion.circle
                                        initial={{ strokeDashoffset: 502 }}
                                        animate={{
                                            strokeDashoffset: 502 - (502 * (attendanceStats.percentage / 100))
                                        }}
                                        transition={{ duration: 2, ease: "circOut" }}
                                        cx="104"
                                        cy="104"
                                        r="80"
                                        stroke="url(#gradientIntegrity)"
                                        strokeWidth="12"
                                        strokeDasharray="502"
                                        strokeLinecap="round"
                                        fill="transparent"
                                        style={{ transformOrigin: 'center', filter: 'url(#glow)' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl sm:text-6xl font-black text-secondary-900 tracking-tighter">
                                            {attendanceStats.percentage}
                                        </span>
                                        <span className="text-xl sm:text-2xl font-black text-primary-600">%</span>
                                    </div>
                                    <div className="mt-2 flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">Live Integrity</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="p-4 bg-secondary-50/50 rounded-2xl border border-secondary-100 hover:border-emerald-200 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                                        <p className="text-[9px] font-black text-secondary-500 uppercase tracking-widest">Attend</p>
                                    </div>
                                    <p className="text-2xl font-bold text-secondary-900">{attendanceStats.present}</p>
                                </div>
                                <div className="p-4 bg-secondary-50/50 rounded-2xl border border-secondary-100 hover:border-primary-200 transition-all">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                                        <p className="text-[9px] font-black text-secondary-500 uppercase tracking-widest">Absents</p>
                                    </div>
                                    <p className="text-2xl font-bold text-secondary-900">{attendanceStats.total - attendanceStats.present}</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-secondary-50 space-y-4">
                                <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em] mb-4">Subject Insight</h4>
                                {subjects.slice(0, 3).map(sub => {
                                    const subAttendance = studentHistory?.filter(r => r.subject?._id === sub._id);
                                    const total = subAttendance?.length || 0;
                                    const present = subAttendance?.filter(r => r.status === 'present').length || 0;
                                    const perc = total > 0 ? (present / total) * 100 : 0;
                                    return (
                                        <div key={sub._id} className="space-y-1.5">
                                            <div className="flex justify-between items-center text-[10px] font-bold">
                                                <span className="text-secondary-700 uppercase">{sub.name}</span>
                                                <span className={perc < 75 ? 'text-red-500' : 'text-emerald-500'}>{Math.round(perc)}%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-secondary-50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${perc}%` }}
                                                    className={`h-full rounded-full ${perc < 75 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                ></motion.div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ROW 2: FULL WIDTH INTELLIGENCE */}
                <div className="lg:col-span-3">
                    <div className="card-premium border-l-8 border-primary-500 overflow-hidden relative group min-h-[500px] flex flex-col py-10">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 group-hover:rotate-12 transition-all duration-500">
                            <Sparkles size={120} className="text-primary-500" />
                        </div>
                        <div className="flex items-center gap-4 mb-10 relative z-10 px-2">
                            <div className="p-4 bg-primary-50 text-primary-600 rounded-[1.5rem] shadow-sm">
                                <Sparkles size={26} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.4em] leading-none mb-2">Neural Feed</p>
                                <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tight">Daily Intelligence</h3>
                            </div>
                        </div>
                        <div className="flex flex-col gap-6 relative z-10 px-2 flex-grow">
                            {[
                                {
                                    tag: 'CODING',
                                    title: 'Zero Trust Architecture',
                                    desc: 'Never trust, always verify. The modern standard for secure decentralized systems. Implementing granular access control and continuous validation across all nodes in the network architecture.',
                                    icon: <Code size={18} />,
                                    color: 'text-accent-blue bg-blue-50 border-blue-100',
                                    url: 'https://www.crowdstrike.com/cybersecurity-101/zero-trust-architecture/'
                                },
                                {
                                    tag: 'GENERAL',
                                    title: 'Quantum Advantage',
                                    desc: 'Google Sycamore processor completes a task in 200s that would take 10k years. This leap in computational power opens new frontiers for cryptography, material science, and pharmaceutical research.',
                                    icon: <TrendingUp size={18} />,
                                    color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                                    url: 'https://ai.googleblog.com/2019/10/quantum-supremacy-using-programmable.html'
                                },
                                {
                                    tag: 'TREND',
                                    title: 'Next.js 15 Partial Prerendering',
                                    desc: 'Optimizing static and dynamic content delivery seamlessly for edge computing. Allowing developers to define specific boundaries for dynamic content while keeping the shell fully static.',
                                    icon: <Sparkles size={18} />,
                                    color: 'text-amber-600 bg-amber-50 border-amber-100',
                                    url: 'https://nextjs.org/blog/next-15'
                                }
                            ].map((info, idx) => (
                                <a
                                    key={idx}
                                    href={info.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-[2rem] bg-secondary-50/30 border border-secondary-100/50 hover:bg-white hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-300 group/item"
                                >
                                    <div className={`p-4 rounded-2xl shadow-sm group-hover/item:scale-110 transition-transform shrink-0 ${info.color}`}>
                                        {info.icon}
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary-500">{info.tag}</span>
                                            <div className="w-1 h-1 bg-secondary-200 rounded-full"></div>
                                            <span className="text-[8px] font-bold text-secondary-400 uppercase tracking-widest">Global Node</span>
                                        </div>
                                        <h4 className="text-sm font-black text-secondary-800 group-hover/item:text-primary-600 transition-colors uppercase tracking-tight mb-2">{info.title}</h4>
                                        <p className="text-xs text-secondary-500 leading-relaxed font-bold opacity-80 group-hover/item:opacity-100 line-clamp-2">
                                            {info.desc}
                                        </p>
                                    </div>
                                    <div className="shrink-0 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0 hidden md:block">
                                        <div className="p-2 bg-primary-50 text-primary-600 rounded-xl">
                                            <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                        <div className="px-2 mt-auto">
                            <a 
                                href="https://techcrunch.com/category/startups/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ backgroundColor: '#800000' }}
                                className="w-full py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 hover:shadow-[0_20px_40px_-5px_rgba(128,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-4 shadow-[0_15px_30px_-5px_rgba(128,0,0,0.3)] active:scale-95 border border-white/10"
                            >
                                Explore Global Data Matrix <ExternalLink size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showTimetableModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTimetableModal(false)}
                            className="absolute inset-0 bg-secondary-900/60 backdrop-blur-lg"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative z-10 border border-secondary-100 flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between transition-colors shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-accent-blue text-white rounded-lg"><Calendar size={16} /></div>
                                    <h2 className="text-lg font-bold text-secondary-900 uppercase tracking-tight transition-colors">
                                        Manage My Timetable
                                    </h2>
                                </div>
                                <button onClick={() => setShowTimetableModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold uppercase text-xs">✕</button>
                            </div>
                            <form onSubmit={handleSaveTimetable} className="flex flex-col overflow-hidden min-h-0">
                                <div className="p-4 overflow-y-auto space-y-2 flex-1 min-h-0">
                                    <div className="overflow-x-auto bg-white rounded-xl border border-secondary-100 shadow-sm">
                                        <table className="w-full text-left border-collapse min-w-[700px]">
                                            <thead>
                                                <tr className="bg-secondary-50 border-b border-secondary-100">
                                                    <th className="p-2 text-[10px] font-bold text-secondary-500 uppercase tracking-widest text-center border-r border-secondary-100 w-24">Day</th>
                                                    {[1, 2, 3, 4, 5, 6].map(p => (
                                                        <th key={p} className="p-2 text-[10px] font-bold text-secondary-500 uppercase tracking-widest text-center border-r border-secondary-100 last:border-0 w-32">Period {p}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {timetable.map((daySchedule, dayIndex) => (
                                                    <tr key={daySchedule.day} className="border-b border-secondary-50 last:border-0 hover:bg-secondary-50/50 transition-colors">
                                                        <td className="p-2 border-r border-secondary-100 align-middle">
                                                            <div className="font-bold text-secondary-900 uppercase tracking-wider text-[10px] text-center">{daySchedule.day}</div>
                                                        </td>
                                                        {daySchedule.slots.map((slot, slotIndex) => (
                                                            <td key={slotIndex} className="p-1 px-2 border-r border-secondary-100 last:border-0 align-middle">
                                                                <select
                                                                    className="w-full text-[10px] py-1.5 px-1 bg-transparent border border-transparent rounded hover:bg-white hover:border-secondary-200 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all cursor-pointer font-medium text-secondary-700 text-center truncate"
                                                                    value={slot.subject || ''}
                                                                    onChange={(e) => {
                                                                        handleTimeChange(dayIndex, slotIndex, 'subject', e.target.value);
                                                                        handleTimeChange(dayIndex, slotIndex, 'isBooked', !!e.target.value);
                                                                    }}
                                                                >
                                                                    <option value="" className="text-secondary-400 font-normal">-- Free --</option>
                                                                    {subjects?.map(sub => (
                                                                        <option key={sub._id} value={sub._id}>{sub.name}</option>
                                                                    ))}
                                                                </select>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-secondary-100 bg-white flex justify-end gap-3 shrink-0">
                                    <button type="button" onClick={() => setShowTimetableModal(false)} className="btn-secondary px-6 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-8 shadow-md font-black uppercase tracking-widest text-[10px]">
                                        <Save size={16} />
                                        Save My Timetable
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Stats Summary Modal */}
            <AnimatePresence>
                {statsModal.isOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setStatsModal({ ...statsModal, isOpen: false })}
                            className="absolute inset-0 bg-secondary-900/80 backdrop-blur-[12px]"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-secondary-100 flex flex-col max-h-[85vh]"
                        >
                            <div className="px-8 py-6 bg-secondary-50/50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary-600 text-white rounded-2xl shadow-lg shadow-primary-500/20">
                                        {statsModal.type === 'students' && <GraduationCap size={20} />}
                                        {statsModal.type === 'teachers' && <Users size={20} />}
                                        {statsModal.type === 'subjects' && <BookOpen size={20} />}
                                        {statsModal.type === 'departments' && <Building2 size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-secondary-900 uppercase tracking-tight">{statsModal.title}</h3>
                                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em]">Matrix Registry Overview</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStatsModal({ ...statsModal, isOpen: false })}
                                    className="p-3 bg-white text-secondary-400 hover:text-secondary-900 hover:shadow-md rounded-2xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto max-h-[500px] space-y-3 custom-scrollbar">
                                {statsModal.data?.length > 0 ? statsModal.data.map((item, idx) => (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        key={item._id || idx}
                                        className="h-20 px-6 bg-secondary-50/50 rounded-2xl border border-secondary-100 flex items-center justify-between group hover:bg-white hover:border-primary-200 hover:shadow-lg transition-all cursor-default shrink-0"
                                    >
                                        <div className="flex items-center gap-5 flex-1 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-secondary-200 flex items-center justify-center text-xs font-black text-primary-600 shadow-sm uppercase shrink-0 group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                                                {(item.programme || item.user?.name || item.name)?.substring(0, 2)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-black text-secondary-800 uppercase tracking-tight group-hover:text-primary-600 transition-colors truncate">
                                                    {item.programme || item.user?.name || item.name}
                                                </p>
                                                <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mt-1 truncate">
                                                    {statsModal.type === 'students' && `ID: ${item.rollNumber || 'N/A'} • ${item.department?.name || 'GEN'}`}
                                                    {statsModal.type === 'teachers' && `${item.designation || 'Faculty'} • ${item.department?.name || item.user?.department?.name || 'GEN'}`}
                                                    {statsModal.type === 'subjects' && `Code: ${item.code || 'N/A'} • Credits: ${item.credits || '-'}`}
                                                    {statsModal.type === 'departments' && `Programme: ${item.name || 'N/A'} • Head: ${item.head || 'Staff'}`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="ml-4 px-4 py-1.5 bg-white rounded-xl border border-secondary-100 text-[9px] font-black text-secondary-500 uppercase tracking-widest shadow-sm shrink-0 whitespace-nowrap">
                                            ACTIVE
                                        </div>
                                    </motion.div>
                                )) : (
                                    <div className="py-20 text-center">
                                        <div className="w-16 h-16 bg-secondary-50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-secondary-100 opacity-50">
                                            <Loader2 className="text-secondary-400 animate-spin" size={24} />
                                        </div>
                                        <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">No Node Data Registered</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-secondary-50/50 border-t border-secondary-100 flex justify-end">
                                <button
                                    onClick={() => setStatsModal({ ...statsModal, isOpen: false })}
                                    className="px-8 py-3 bg-secondary-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                                >
                                    Close Node
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Dashboard;

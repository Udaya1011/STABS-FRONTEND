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
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudents } from '../store/slices/studentSlice';
import { getTeachers, getMyProfile, updateMyAvailability, syncMyFreeSlots } from '../store/slices/teacherSlice';
import { getSubjects } from '../store/slices/subjectSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { getMyAppointments, updateAppointmentStatus } from '../store/slices/appointmentSlice';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { students } = useSelector((state) => state.students);
    const { teachers, currentTeacherProfile } = useSelector((state) => state.teachers);
    const { subjects } = useSelector((state) => state.subjects);
    const { departments } = useSelector((state) => state.departments);
    const { appointments } = useSelector((state) => state.appointments);

    const [showTimetableModal, setShowTimetableModal] = useState(false);
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
        // Only fetch students if admin or teacher (regular students can't fetch all students)
        if (user?.role === 'admin' || user?.role === 'teacher') {
            dispatch(getStudents());
        }
        
        // Teachers list is public to all authenticated users
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
        { name: 'Active Students', value: students.length, icon: GraduationCap, color: 'text-primary-600', bgColor: 'bg-primary-50', trend: 'Live', trendUp: true },
        { name: 'Faculty Staff', value: teachers.length, icon: Users, color: 'text-accent-purple', bgColor: 'bg-purple-50', trend: 'Verified', trendUp: true },
        { name: 'Active Subjects', value: subjects.length, icon: BookOpen, color: 'text-accent-blue', bgColor: 'bg-blue-50', trend: 'Synced', trendUp: true, roles: ['admin', 'student'] },
        { name: 'Departments', value: departments.length, icon: Building2, color: 'text-amber-600', bgColor: 'bg-amber-50', trend: 'Global', trendUp: true, roles: ['admin', 'student'] },
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

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
                        Academic <span className="text-primary-600 tracking-tight uppercase">Overview</span>
                    </h1>
                    <p className="text-secondary-500 font-medium mt-1">
                        Systems online. Welcome back, <span className="text-secondary-900 font-bold uppercase">{user?.name}</span>.
                    </p>
                </div>
                
                {/* FAST ACCESS BUTTONS */}
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                    <button 
                        onClick={() => navigate('/attendance')}
                        className="group flex-1 lg:flex-none bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-primary-600/30 active:scale-95 transition-all border-b-4 border-primary-800"
                    >
                        <div className="p-2 bg-white/10 rounded-xl group-hover:rotate-12 transition-transform">
                            <ClipboardList size={22} className="text-white" />
                        </div>
                        <span className="whitespace-nowrap">Mark Attendance</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    {user?.role === 'teacher' && (
                        <>
                            <button
                                onClick={async () => {
                                    try {
                                        const token = user.token;
                                        const config = { headers: { Authorization: `Bearer ${token}` } };
                                        toast.loading('Syncing free periods...', { id: 'sync' });
                                        const res = await axios.post('/api/appointments/sync-slots', {}, config);
                                        toast.success(res.data.message, { id: 'sync' });
                                        dispatch(getMyAppointments());
                                    } catch (err) {
                                        toast.error(err.response?.data?.message || 'Sync failed', { id: 'sync' });
                                    }
                                }}
                                className="group flex-1 lg:flex-none bg-secondary-900 hover:bg-black text-white px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                            >
                                <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                <span className="whitespace-nowrap">Sync All Slots</span>
                            </button>
                            <button 
                                onClick={handleOpenTimetableModal}
                                className="group flex-1 lg:flex-none bg-white border border-secondary-200 text-secondary-900 px-8 py-4 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm hover:border-primary-600 hover:text-primary-600 transition-all active:scale-95"
                            >
                                <Calendar size={18} /> 
                                <span className="whitespace-nowrap">My Schedule</span>
                            </button>
                        </>
                    )}
                    
                    <div className="hidden xl:flex items-center gap-2 px-6 py-4 bg-white border border-secondary-100 rounded-[2rem] shadow-sm">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-secondary-500">Node Sync: 5005</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
                {stats.map((stat) => (
                    <div
                        key={stat.name}
                        className="card-premium group hover:border-primary-200"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`${stat.bgColor} ${stat.color} p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform`}>
                                <stat.icon size={22} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${stat.trendUp ? 'bg-green-50 text-green-600' : 'bg-secondary-100 text-secondary-500'}`}>
                                {stat.trend}
                            </span>
                        </div>
                        <h3 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">{stat.name}</h3>
                        <p className="text-3xl font-bold text-secondary-900 mt-1">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                {/* Left Column: Recent Activity */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="card-premium">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Upcoming Consultations</h3>
                                <p className="text-xs font-black text-secondary-400 uppercase tracking-[0.2em]">Priority Academic Sessions</p>
                            </div>
                            <button className="p-2 text-secondary-400 hover:text-secondary-600"><MoreVertical size={20} /></button>
                        </div>

                        <div className="space-y-3">
                            {upcomingAppointments.length > 0 ? upcomingAppointments.map((app) => (
                                <div key={app._id} className="flex items-center gap-5 p-4 rounded-2xl border border-secondary-50 hover:bg-secondary-50/50 hover:border-secondary-100 transition-all group">
                                    <div className="text-xs font-black text-primary-600 w-24 uppercase truncate">
                                        {new Date(app.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-secondary-800 transition-colors text-sm uppercase truncate">{app.reason || 'General Inquiry'}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">
                                                {user.role === 'teacher' ? `With: ${app.student?.name || 'Student'}` : `With: ${app.teacher?.name || 'Faculty'}`}
                                            </p>
                                        </div>
                                    </div>
                                    {user.role === 'teacher' && app.status === 'pending' ? (
                                        <button
                                            onClick={() => handleUpdateStatus(app._id, 'approved')}
                                            className="px-4 py-1.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-700 transition-all shadow-md"
                                        >
                                            Confirm
                                        </button>
                                    ) : (
                                        <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${app.status === 'approved' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                            {app.status}
                                        </div>
                                    )}
                                </div>
                            )) : (
                                <div className="py-10 text-center bg-secondary-50/50 rounded-2xl border border-dashed border-secondary-200">
                                    <Calendar className="mx-auto text-secondary-200 mb-2" size={32} />
                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">No Priority Sessions Scheduled</p>
                                </div>
                            )}
                        </div>

                        <button className="w-full mt-6 py-4 bg-secondary-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-primary-600 transition-all flex items-center justify-center gap-2 shadow-lg">
                            Archive & Records <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Right Column: Mini Info Cards */}
                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-secondary-900 to-black rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl border border-secondary-800">
                        <div className="relative z-10">
                            <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">AI Neural Engine</h4>
                            <p className="text-xs text-secondary-400 font-black uppercase tracking-widest mb-8">Scheduling Optimizer v2.4</p>
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm"></div>
                                    <span className="text-[10px] font-bold text-secondary-300 uppercase">Synchronized with Node 16</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-sm"></div>
                                    <span className="text-[10px] font-bold text-secondary-300 uppercase">Latency: 24ms</span>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg">Open Control Panel</button>
                        </div>
                    </div>

                    <div className="card-premium">
                        <h3 className="text-lg font-bold text-secondary-900 mb-6 uppercase tracking-tight">System Node Pulse</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Database Grid', status: 'online', color: 'bg-emerald-500' },
                                { label: 'Auth Middleware', status: 'online', color: 'bg-emerald-500' },
                                { label: 'Socket Cluster', status: 'active', color: 'bg-primary-500 animate-pulse' },
                                { label: 'Blob Store', status: 'online', color: 'bg-emerald-500' },
                            ].map((node, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 ${node.color} rounded-full`}></div>
                                        <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">{node.label}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-secondary-900 uppercase">{node.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timetable Modal */}
            <AnimatePresence>
                {showTimetableModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowTimetableModal(false)}
                            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
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
        </div>
    );
};

export default Dashboard;

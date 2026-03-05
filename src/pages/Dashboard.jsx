import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
    GraduationCap
} from 'lucide-react';
import { getStudents } from '../store/slices/studentSlice';
import { getTeachers } from '../store/slices/teacherSlice';
import { getSubjects } from '../store/slices/subjectSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { getMyAppointments, updateAppointmentStatus } from '../store/slices/appointmentSlice';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const { students } = useSelector((state) => state.students);
    const { teachers } = useSelector((state) => state.teachers);
    const { subjects } = useSelector((state) => state.subjects);
    const { departments } = useSelector((state) => state.departments);
    const { appointments } = useSelector((state) => state.appointments);

    useEffect(() => {
        dispatch(getStudents());
        dispatch(getTeachers());
        dispatch(getSubjects());
        dispatch(getDepartments());
        dispatch(getMyAppointments());
    }, [dispatch]);

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
                <div className="flex gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-secondary-100 rounded-xl shadow-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-secondary-500">Live Server Port: 5005</span>
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
                                            className="px-4 py-1.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20"
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
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600/20 rounded-full -mr-24 -mt-24 blur-3xl animate-pulse"></div>
                        <div className="relative z-10">
                            <h4 className="text-xl font-bold mb-2 uppercase tracking-tight">AI Neural Engine</h4>
                            <p className="text-xs text-secondary-400 font-black uppercase tracking-widest mb-8">Scheduling Optimizer v2.4</p>
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    <span className="text-[10px] font-bold text-secondary-300 uppercase">Synchronized with Node 16</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                    <span className="text-[10px] font-bold text-secondary-300 uppercase">Latency: 24ms</span>
                                </div>
                            </div>
                            <button className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-primary-900/40">Open Control Panel</button>
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
        </div>
    );
};

export default Dashboard;

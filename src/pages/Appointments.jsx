import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getMyAppointments, reset, createFreeSlot, getAvailableSlots, bookAvailableSlot, updateAppointmentStatus, cancelSlot } from '../store/slices/appointmentSlice';
import { getSubjects } from '../store/slices/subjectSlice';
import { Calendar, Clock, MapPin, User, CheckCircle2, XCircle, AlertCircle, Plus, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Appointments = () => {
    const [activeTab, setActiveTab] = useState('upcoming');
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [slotData, setSlotData] = useState({ date: '', startTime: '', endTime: '' });
    const [bookingData, setBookingData] = useState({ reason: '', priority: 'medium', subject: '' });
    const [showTodayOnly, setShowTodayOnly] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');

    const dispatch = useDispatch();
    const { appointments, availableSlots, isLoading } = useSelector((state) => state.appointments);
    const { subjects } = useSelector((state) => state.subjects);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getMyAppointments());
        dispatch(getAvailableSlots());
        dispatch(getSubjects());
        return () => dispatch(reset());
    }, [dispatch]);

    const filteredAppointments = appointments.filter(app => {
        const isPast = new Date(app.date) < new Date();
        if (app.status === 'available') return false;
        return activeTab === 'upcoming' ? !isPast && !['completed', 'cancelled'].includes(app.status) : isPast || ['completed', 'cancelled'].includes(app.status);
    });

    const getStatusStyles = (status) => {
        switch (status) {
            case 'approved': return 'text-success-600 bg-success-50 border-success-100';
            case 'pending': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            case 'completed': return 'text-accent-blue bg-blue-50 border-blue-100';
            case 'available': return 'text-primary-600 bg-primary-50 border-primary-100';
            case 'cancelled': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-secondary-600 bg-secondary-50 border-secondary-100';
        }
    };

    const handleCreateSlot = (e) => {
        e.preventDefault();
        dispatch(createFreeSlot(slotData))
            .unwrap()
            .then(() => {
                toast.success('Free slot added successfully');
                setShowSlotModal(false);
                setSlotData({ date: '', startTime: '', endTime: '' });
                dispatch(getMyAppointments());
            })
            .catch(err => toast.error(err));
    };

    const handleBookSlot = (e) => {
        e.preventDefault();
        dispatch(bookAvailableSlot({ id: selectedSlot._id, bookingData }))
            .unwrap()
            .then(() => {
                toast.success('Slot booked successfully');
                setShowBookModal(false);
                setBookingData({ reason: '', priority: 'medium', subject: '' });
                dispatch(getMyAppointments());
            })
            .catch(err => toast.error(err));
    };

    const handleUpdateStatus = (id, status) => {
        dispatch(updateAppointmentStatus({ id, statusData: { status } }))
            .unwrap()
            .then(() => toast.success(`Appointment ${status}`))
            .catch(err => toast.error(err));
    };

    const handleCancelSlot = (e) => {
        e.preventDefault();
        dispatch(cancelSlot({ id: selectedSlot._id, reason: cancelReason }))
            .unwrap()
            .then(() => {
                toast.success('Slot removed successfully');
                setShowCancelModal(false);
                setCancelReason('');
                dispatch(getMyAppointments());
            })
            .catch(err => toast.error(err));
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 uppercase tracking-tight">Academic Consultations</h1>
                    <p className="text-secondary-500 mt-1 font-medium">Schedule and manage your one-on-one sessions with faculty.</p>
                </div>
                {user?.role === 'teacher' && (
                    <button
                        onClick={() => setShowSlotModal(true)}
                        className="btn-primary flex items-center gap-2 shadow-lg shadow-primary-500/20"
                    >
                        <Plus size={20} />
                        Add Free Time
                    </button>
                )}
            </div>

            <div className="flex border-b border-secondary-100 p-1 bg-secondary-50/50 rounded-xl w-fit transition-colors">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'upcoming' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}
                >
                    Upcoming Sessions
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}
                >
                    Session History
                </button>
                <button
                    onClick={() => setActiveTab('slots')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'slots' ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-500 hover:text-secondary-700'}`}
                >
                    {user?.role === 'teacher' ? 'My Free Slots' : 'Available Faculty Slots'}
                </button>
            </div>

            {activeTab === 'slots' && (
                <div className="flex items-center gap-3 px-4 py-2 bg-secondary-50 rounded-2xl border border-secondary-100 w-fit">
                    <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">Daily Phase View:</span>
                    <button 
                        onClick={() => setShowTodayOnly(!showTodayOnly)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${showTodayOnly ? 'bg-primary-600 text-white shadow-lg' : 'bg-white text-secondary-500 border border-secondary-200'}`}
                    >
                        {showTodayOnly ? 'Today Only' : 'Show All Days'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence mode="popLayout">
                    {(() => {
                        let list = activeTab === 'slots' 
                            ? (user?.role === 'teacher' 
                                ? appointments.filter(a => a.appointmentType === 'slot' && a.status !== 'cancelled')
                                : availableSlots)
                            : filteredAppointments;

                        if (activeTab === 'slots' && showTodayOnly) {
                            const todayStr = new Date().toDateString();
                            list = list.filter(app => new Date(app.date).toDateString() === todayStr);
                        }

                        // Filter out cancelled slots for students in their general list
                        if (user?.role === 'student' && activeTab === 'slots') {
                            list = list.filter(a => a.status !== 'cancelled');
                        }

                        if (list.length > 0) {
                            return list.map((app) => (
                                <motion.div
                                    key={app._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="card-premium group relative border-none shadow-premium hover:shadow-premium-hover transition-all duration-500"
                                >
                                    <div className={`absolute top-6 right-6 px-2.5 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-widest ${getStatusStyles(app.status)}`}>
                                        {app.status}
                                    </div>

                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 rounded-2xl bg-secondary-50 border border-secondary-100 flex items-center justify-center text-xl font-bold text-secondary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-inner uppercase">
                                            {(app.status === 'available' 
                                                ? app.teacher?.name 
                                                : (user?.role === 'student' ? app.teacher?.name : app.student?.name))?.charAt(0) || 'S'}
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold text-secondary-900 group-hover:text-primary-600 transition-colors truncate uppercase tracking-tight">
                                                {app.status === 'available' 
                                                    ? (app.teacher?.name || 'Staff Member') 
                                                    : (user?.role === 'student' ? app.teacher?.name : (app.student?.name || 'Student'))}
                                            </h3>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest truncate">{app.subject?.name || 'Academic Consultation'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50">
                                            <div className="w-9 h-9 rounded-xl bg-white text-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Calendar size={16} />
                                            </div>
                                            <span className="text-xs font-bold">{new Date(app.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50">
                                            <div className="w-9 h-9 rounded-xl bg-white text-accent-blue rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                <Clock size={16} />
                                            </div>
                                            <span className="text-xs font-bold">{app.startTime} - {app.endTime}</span>
                                        </div>
                                    </div>

                                    {app.status !== 'available' && app.reason && (
                                        <div className="pt-6 border-t border-secondary-50">
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest mb-2">Subject Matter:</p>
                                            <p className="text-sm text-secondary-600 font-medium italic border-l-2 border-primary-200 pl-3 leading-relaxed">"{app.reason}"</p>
                                        </div>
                                    )}

                                    <div className="mt-8">
                                        {user?.role === 'teacher' && app.status === 'pending' && (
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleUpdateStatus(app._id, 'approved')}
                                                    className="flex-1 btn-primary py-2.5 text-[10px] font-black uppercase tracking-widest shadow-md shadow-primary-500/10"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                                    className="flex-1 btn-secondary py-2.5 text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Decline
                                                </button>
                                            </div>
                                        )}
                                        {user?.role === 'student' && app.status === 'available' && (
                                            <button
                                                onClick={() => { setSelectedSlot(app); setShowBookModal(true); }}
                                                className="w-full btn-primary py-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20"
                                            >
                                                Secure This Slot
                                            </button>
                                        )}
                                        {user?.role === 'teacher' && app.status === 'available' && (
                                            <div className="flex flex-col gap-3">
                                                <div className="text-[10px] font-black text-primary-600 bg-primary-50 p-3 rounded-xl border border-primary-100 text-center uppercase tracking-[0.2em] animate-pulse">
                                                    Public Availability Active
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedSlot(app); setShowCancelModal(true); }}
                                                    className="w-full btn-secondary py-2 text-[10px] font-black uppercase tracking-widest text-red-500 border-red-100 hover:bg-red-50"
                                                >
                                                    Remove Slot
                                                </button>
                                            </div>
                                        )}
                                        {user?.role === 'teacher' && app.status !== 'available' && app.appointmentType === 'slot' && (
                                            <div className="flex flex-col gap-3">
                                                <div className="text-[10px] font-black text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 text-center uppercase tracking-[0.2em]">
                                                    Booked by Student
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedSlot(app); setShowCancelModal(true); }}
                                                    className="w-full btn-secondary py-2 text-[10px] font-black uppercase tracking-widest text-red-500 border-red-100 hover:bg-red-50"
                                                >
                                                    Cancel Booked Slot
                                                </button>
                                            </div>
                                        )}
                                        {app.status === 'cancelled' && (
                                            <div className="text-[10px] font-black text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 text-center uppercase tracking-[0.2em]">
                                                Cancelled: {app.cancelReason || 'Work Conflict'}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ));
                        } else {
                            return (
                                <div className="col-span-full py-24 text-center bg-white border border-secondary-100 rounded-3xl shadow-sm flex flex-col items-center transition-colors">
                                    <div className="bg-secondary-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 text-secondary-200">
                                        <XCircle size={40} />
                                    </div>
                                    <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">No Dynamic Windows</h3>
                                    <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium">There are currently no {activeTab === 'slots' ? (showTodayOnly ? "slots for today" : "open booking windows") : 'scheduled sessions'} matching your profile.</p>
                                </div>
                            );
                        }
                    })()}
                </AnimatePresence>
            </div>

            {/* Cancel Modal */}
            <AnimatePresence>
                {showCancelModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCancelModal(false)} className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-secondary-100">
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-600 text-white rounded-lg"><AlertCircle size={18} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Deactivate Slot</h2>
                                </div>
                                <button onClick={() => setShowCancelModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCancelSlot} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Reason for Removal</label>
                                    <textarea 
                                        required 
                                        className="input-field min-h-[120px]" 
                                        placeholder="Explain why this slot is no longer available (e.g., Departmental Meeting, Leave, etc.)" 
                                        value={cancelReason} 
                                        onChange={(e) => setCancelReason(e.target.value)} 
                                    />
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowCancelModal(false)} className="flex-1 btn-secondary py-4 font-black uppercase tracking-widest text-[10px]">Back</button>
                                    <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] shadow-xl shadow-red-500/20 text-[10px]">
                                        Confirm Deletion
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <AnimatePresence>
                {showSlotModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSlotModal(false)} className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-secondary-100">
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><Plus size={18} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Publish Free Slot</h2>
                                </div>
                                <button onClick={() => setShowSlotModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleCreateSlot} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Consultation Date</label>
                                    <input type="date" required className="input-field" value={slotData.date} onChange={(e) => setSlotData({ ...slotData, date: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Start Window</label>
                                        <input type="time" required className="input-field" value={slotData.startTime} onChange={(e) => setSlotData({ ...slotData, startTime: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">End Window</label>
                                        <input type="time" required className="input-field" value={slotData.endTime} onChange={(e) => setSlotData({ ...slotData, endTime: e.target.value })} />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20">
                                        <Save size={18} /> Authorize Availability
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {showBookModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowBookModal(false)} className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 border border-secondary-100">
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><CheckCircle2 size={18} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Confirm Booking</h2>
                                </div>
                                <button onClick={() => setShowBookModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 transition-all"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleBookSlot} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Relevant Subject</label>
                                    <select required className="input-field" value={bookingData.subject} onChange={(e) => setBookingData({ ...bookingData, subject: e.target.value })}>
                                        <option value="">Select Domain</option>
                                        {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Consultation Agenda</label>
                                    <textarea required className="input-field min-h-[100px]" placeholder="Outline what you wish to discuss..." value={bookingData.reason} onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Priority Level</label>
                                    <div className="flex gap-2 p-1 bg-secondary-50 rounded-xl border border-secondary-100">
                                        {['low', 'medium', 'high'].map(p => (
                                            <button
                                                key={p} type="button"
                                                onClick={() => setBookingData({ ...bookingData, priority: p })}
                                                className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${bookingData.priority === p ? 'bg-white text-primary-600 shadow-sm' : 'text-secondary-400 hover:text-secondary-600'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-black uppercase tracking-[0.2em] shadow-xl shadow-primary-500/20">
                                        Finalize Registration
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

export default Appointments;

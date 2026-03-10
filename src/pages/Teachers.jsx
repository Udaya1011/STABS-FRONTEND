import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Mail, MapPin, Calendar, Star, ChevronLeft, ChevronRight, GraduationCap, Plus, Users, X, Save, Edit2, Trash2, Key, Eye, Info, UserCheck, Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeachers, updateTeacher, deleteTeacher, registerTeacher } from '../store/slices/teacherSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { getSubjects } from '../store/slices/subjectSlice';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Teachers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepId, setSelectedDepId] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [showModal, setShowModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState({
        name: '', email: '', password: '', designation: '', department: '', qualifications: '', phoneNumber: '', specialization: ''
    });
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

    const dispatch = useDispatch();
    const { teachers, isLoading } = useSelector((state) => state.teachers);
    const { departments } = useSelector((state) => state.departments);
    const { subjects } = useSelector((state) => state.subjects);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getTeachers());
        dispatch(getDepartments());
        dispatch(getSubjects());

        // Global Navbar Events
        const handleSearch = (e) => setSearchQuery(e.detail);
        const handleAdd = () => handleOpenModal();
        const handleFilter = (e) => setSelectedDepId(e.detail);

        window.addEventListener('global-search', handleSearch);
        window.addEventListener('open-add-modal', handleAdd);
        window.addEventListener('department-filter', handleFilter);

        return () => {
            window.removeEventListener('global-search', handleSearch);
            window.removeEventListener('open-add-modal', handleAdd);
            window.removeEventListener('department-filter', handleFilter);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedDepId]);

    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.designation?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = selectedDepId === 'all' || (t.user?.department?._id || t.user?.department) === selectedDepId;
        return matchesSearch && matchesFilter;
    });

    const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
    const currentTeachers = filteredTeachers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleOpenModal = (t = null) => {
        if (t) {
            setIsEditing(true);
            setCurrentTeacher({
                _id: t._id,
                name: t.user?.name || '',
                email: t.user?.email || '',
                designation: t.designation || '',
                department: t.user?.department?._id || t.user?.department || '',
                qualifications: t.qualifications || '',
                phoneNumber: t.phoneNumber || '',
                specialization: t.specialization || ''
            });
        } else {
            setIsEditing(false);
            setCurrentTeacher({ name: '', email: '', password: '', designation: '', department: '', qualifications: '', phoneNumber: '', specialization: '' });
        }
        setShowModal(true);
    };

    const handleView = (t) => {
        setSelectedTeacher(t);
        setShowSidePanel(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isEditing) {
            dispatch(updateTeacher({ id: currentTeacher._id, teacherData: currentTeacher }))
                .unwrap()
                .then(() => {
                    toast.success('Faculty updated');
                    setShowModal(false);
                    dispatch(getTeachers());
                })
                .catch(err => toast.error(err));
        } else {
            dispatch(registerTeacher(currentTeacher))
                .unwrap()
                .then(() => {
                    toast.success('Faculty registered successfully');
                    setShowModal(false);
                    dispatch(getTeachers());
                })
                .catch(err => toast.error(err));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this faculty member? This will also delete their login account.')) {
            dispatch(deleteTeacher(id))
                .unwrap()
                .then(() => toast.success('Faculty removed'))
                .catch(err => toast.error(err));
        }
    };

    const handleOpenTimetableModal = (t) => {
        setCurrentTeacher(t);
        const initialTimetable = t.availability?.length > 0
            ? JSON.parse(JSON.stringify(t.availability))
            : generateEmptySchedule();
        setTimetable(initialTimetable);
        setShowTimetableModal(true);
    };

    const handleSaveTimetable = async (e) => {
        e.preventDefault();
        try {
            const storedUser = JSON.parse(localStorage.getItem('user'));
            const token = storedUser?.token || user?.token;
            if (!token) {
                toast.error('Not authenticated. Please log in again.');
                return;
            }

            const cleanedTimetable = timetable.map(day => ({
                ...day,
                slots: day.slots.map(slot => ({
                    ...slot,
                    subject: slot.subject === '' ? null : slot.subject
                }))
            }));

            await axios.put(
                `/api/teachers/${currentTeacher._id}/timetable`,
                { availability: cleanedTimetable },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Timetable saved successfully!');
            setShowTimetableModal(false);
            dispatch(getTeachers());
        } catch (error) {
            console.error('Timetable save error:', error?.response || error);
            const errorMsg = error?.response?.data?.error || error?.response?.data?.message || 'Failed to save timetable';
            toast.error(errorMsg);
        }
    };

    const handleTimeChange = (dayIndex, slotIndex, type, value) => {
        setTimetable(prev => {
            const newTimetable = JSON.parse(JSON.stringify(prev));
            newTimetable[dayIndex].slots[slotIndex][type] = value;
            return newTimetable;
        });
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 -mt-2">
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl shadow-primary-500/10 border border-primary-100 overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-primary-600 sticky top-0 z-10 border-b border-primary-700 shadow-sm">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-20">#</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest">Faculty</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest">Designation</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest">Email</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center">Programme</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center">Mobile Number</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-300">
                            {isLoading && teachers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                            <p className="text-sm font-bold text-secondary-500 uppercase tracking-widest">Syncing Faculty Nodes...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Synchronizing directory...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-4 border border-secondary-100"><Users size={32} /></div>
                                            <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Access Controlled Cluster</h3>
                                            <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium">No faculty profiles identified in the current sector.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentTeachers.map((teacher, index) => (
                                    <tr key={teacher._id} className="hover:bg-secondary-50/50 transition-all group">
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-[10px] font-black text-secondary-500 uppercase tracking-widest">
                                                {String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, '0')}
                                            </span>
                                        </td>
                                        <td className="py-4 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center text-sm font-bold text-secondary-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm shrink-0 overflow-hidden uppercase border border-secondary-100">
                                                    {teacher.user?.avatar && !teacher.user.avatar.includes('default.png') ? (
                                                        <img src={teacher.user.avatar} alt={teacher.user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        teacher.user?.name?.charAt(0)
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-primary-600 transition-colors font-display">{teacher.user?.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[10px] font-black text-secondary-600 tracking-wider uppercase bg-secondary-50 px-2 py-0.5 rounded border border-secondary-100">{teacher.designation || 'FACULTY'}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-medium text-primary-600 truncate max-w-[150px] inline-block">{teacher.user?.email}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-xs font-bold text-secondary-700">{teacher.user?.department?.programme || teacher.user?.department?.name || 'General Portfolio'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-widest border border-primary-100 mr-2">
                                                {teacher.phoneNumber || 'Not Provided'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleView(teacher)}
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm border border-emerald-100/50"
                                                    title="View Specifications"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button onClick={() => handleOpenTimetableModal(teacher)} className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all shadow-sm border border-purple-100/50" title="Manage Timetable">
                                                            <Calendar size={15} />
                                                        </button>
                                                        <button onClick={() => handleOpenModal(teacher)} className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all shadow-sm border border-primary-100/50" title="Edit Profile">
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button onClick={() => handleDelete(teacher._id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm border border-red-100/50" title="Delete Profile">
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-8 py-4 border-t border-secondary-100 flex items-center justify-start gap-4 bg-white sticky bottom-0">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="text-secondary-300 hover:text-secondary-900 disabled:opacity-30 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs font-black text-secondary-900 uppercase tracking-widest leading-none">
                        Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                        disabled={currentPage === totalPages || totalPages === 0}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="text-secondary-300 hover:text-secondary-900 disabled:opacity-30 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>


            {/* Registration/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowModal(false)}
                            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 border border-secondary-100"
                        >
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><Plus size={20} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">
                                        {isEditing ? 'Sync Faculty Node' : 'Faculty Registration Hub'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold text-xs uppercase">✕</button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Full Name<span className="text-red-500">*</span></label>
                                        <input required className="input-field" placeholder="Dr. Sarah Connor" value={currentTeacher.name} onChange={(e) => setCurrentTeacher({ ...currentTeacher, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Email<span className="text-red-500">*</span></label>
                                        <input required type="email" className="input-field" placeholder="sarah@university.edu" value={currentTeacher.email} onChange={(e) => setCurrentTeacher({ ...currentTeacher, email: e.target.value })} disabled={isEditing} />
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12} /> Access Password<span className="text-red-500">*</span></label>
                                        <input required type="password" className="input-field" placeholder="••••••••" value={currentTeacher.password} onChange={(e) => setCurrentTeacher({ ...currentTeacher, password: e.target.value })} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Designation</label>
                                        <input className="input-field uppercase" placeholder="Professor" value={currentTeacher.designation} onChange={(e) => setCurrentTeacher({ ...currentTeacher, designation: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Programme<span className="text-red-500">*</span></label>
                                        <select required className="input-field cursor-pointer font-bold text-secondary-700" value={currentTeacher.department} onChange={(e) => setCurrentTeacher({ ...currentTeacher, department: e.target.value })}>
                                            <option value="">Select Programme</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.programme || d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Mobile Number</label>
                                        <input 
                                            className="input-field" 
                                            placeholder="+91 XXXXX XXXXX" 
                                            value={currentTeacher.phoneNumber} 
                                            onChange={(e) => setCurrentTeacher({ ...currentTeacher, phoneNumber: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Specialization</label>
                                        <input 
                                            className="input-field" 
                                            placeholder="e.g. Data Mining, AI" 
                                            value={currentTeacher.specialization} 
                                            onChange={(e) => setCurrentTeacher({ ...currentTeacher, specialization: e.target.value })} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Qualifications</label>
                                        <input className="input-field" placeholder="PhD in Logic" value={currentTeacher.qualifications} onChange={(e) => setCurrentTeacher({ ...currentTeacher, qualifications: e.target.value })} />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={18} />
                                        {isEditing ? 'Sync Changes' : 'Initialize Hub'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Side Panel for Faculty Details */}
            <AnimatePresence>
                {showSidePanel && selectedTeacher && (
                    <div className="fixed inset-0 z-50 flex justify-end">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowSidePanel(false)}
                            className="absolute inset-0 bg-secondary-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-4xl bg-white h-[600px] my-auto mr-8 shadow-2xl rounded-[2.5rem] overflow-hidden border border-secondary-100"
                        >
                            <div className="h-full flex flex-col sm:flex-row">
                                {/* Left Side: Image + Action */}
                                <div className="w-full sm:w-[350px] bg-secondary-50 p-10 flex flex-col items-center justify-center space-y-8 border-r border-secondary-100">
                                    <div className="relative group">
                                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500 to-primary-100 rounded-[3rem] opacity-20 group-hover:opacity-30 transition-opacity blur-xl"></div>
                                        <img
                                            src={selectedTeacher.user?.avatar}
                                            alt={selectedTeacher.user?.name}
                                            className="w-56 h-72 object-cover rounded-[2rem] shadow-2xl relative z-10 border-4 border-white grayscale group-hover:grayscale-0 transition-all duration-500"
                                        />
                                    </div>

                                    <button className="w-full py-4 bg-[#800000] text-white rounded-xl font-bold text-xs uppercase tracking-[0.2em] shadow-lg shadow-red-900/20 active:scale-95 transition-all">
                                        View Profile
                                    </button>
                                </div>

                                {/* Right Side: Details */}
                                <div className="flex-1 p-12 flex flex-col justify-center relative bg-white">
                                    <button
                                        onClick={() => setShowSidePanel(false)}
                                        className="absolute top-6 right-6 p-2 text-secondary-400 hover:text-secondary-900 rounded-full hover:bg-secondary-50 transition-all"
                                    >
                                        <X size={24} strokeWidth={3} />
                                    </button>

                                    <div className="space-y-10">
                                        <div>
                                            <h3 className="text-4xl font-black text-secondary-900 tracking-tight leading-tight uppercase">
                                                {selectedTeacher.user?.name}
                                            </h3>
                                            <div className="h-1 w-20 bg-primary-600 mt-4 rounded-full"></div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-100">
                                                    <Briefcase size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Designation</p>
                                                    <p className="text-lg font-bold text-secondary-800 tracking-tight">{selectedTeacher.designation || 'Faculty Member'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                    <BookOpen size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Qualification</p>
                                                    <p className="text-md font-bold text-secondary-700 leading-snug">{selectedTeacher.qualifications || 'Expert Professional'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                                    <Mail size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">E-Mail ID</p>
                                                    <p className="text-md font-bold text-secondary-700 select-all">{selectedTeacher.user?.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                                    <Phone size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Contact Number</p>
                                                    <p className="text-md font-bold text-secondary-700">{selectedTeacher.phoneNumber || '9952XXXXXX'}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 border border-pink-100">
                                                    <Award size={20} />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Area Of Specialization</p>
                                                    <p className="text-md font-bold text-secondary-800">{selectedTeacher.specialization || 'Academic Research'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button
                                                onClick={() => { handleOpenTimetableModal(selectedTeacher); setShowSidePanel(false); }}
                                                className="flex-1 py-4 px-6 bg-secondary-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/10 flex items-center justify-center gap-2"
                                            >
                                                <Calendar size={16} /> Timetable
                                            </button>
                                            <button
                                                onClick={() => { handleOpenModal(selectedTeacher); setShowSidePanel(false); }}
                                                className="flex-1 py-4 px-6 border-2 border-secondary-100 text-secondary-600 rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-secondary-50 hover:text-secondary-900 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Edit2 size={16} /> Edit Data
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
                                        Timetable - {currentTeacher?.user?.name || currentTeacher?.name}
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
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-8 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={16} />
                                        Save Timetable
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

export default Teachers;

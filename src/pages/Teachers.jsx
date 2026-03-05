import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Mail, MapPin, Calendar, Star, ChevronRight, GraduationCap, Plus, Users, X, Save, Edit2, Trash2, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeachers, updateTeacher, deleteTeacher, registerTeacher } from '../store/slices/teacherSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { toast } from 'react-hot-toast';

const Teachers = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTeacher, setCurrentTeacher] = useState({
        name: '', email: '', password: '', designation: '', department: '', qualifications: '', officeHours: ''
    });

    const dispatch = useDispatch();
    const { teachers, isLoading } = useSelector((state) => state.teachers);
    const { departments } = useSelector((state) => state.departments);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getTeachers());
        dispatch(getDepartments());
    }, [dispatch]);

    const filteredTeachers = teachers.filter(t =>
        t.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.designation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                officeHours: t.officeHours || ''
            });
        } else {
            setIsEditing(false);
            setCurrentTeacher({ name: '', email: '', password: '', designation: '', department: '', qualifications: '', officeHours: '' });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isEditing) {
            dispatch(updateTeacher({ id: currentTeacher._id, teacherData: currentTeacher }))
                .unwrap()
                .then(() => {
                    toast.success('Faculty updated');
                    setShowModal(false);
                })
                .catch(err => toast.error(err));
        } else {
            dispatch(registerTeacher(currentTeacher))
                .unwrap()
                .then(() => {
                    toast.success('Faculty registered successfully');
                    setShowModal(false);
                    dispatch(getTeachers()); // Refresh list
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

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 tracking-tight uppercase">Faculty Directory</h1>
                    <p className="text-secondary-500 mt-1 font-medium italic">Manage distinguished professors, researchers, and academic mentors.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-2 shadow-xl shadow-primary-500/20"
                    >
                        <Plus size={18} /> Register Faculty
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, designation, or specialty..."
                        className="input-field pl-12 py-3.5"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && teachers.length === 0 ? (
                    [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white border border-secondary-100 h-80 rounded-3xl shadow-sm"></div>)
                ) : (
                    filteredTeachers.map((teacher) => (
                        <motion.div
                            layout
                            key={teacher._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-premium group relative border-none shadow-premium hover:shadow-premium-hover transition-all duration-500"
                        >
                            {user?.role === 'admin' && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => handleOpenModal(teacher)} className="p-2 bg-white text-secondary-400 rounded-xl hover:text-primary-600 shadow-sm border border-secondary-100 active:scale-90"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(teacher._id)} className="p-2 bg-white text-secondary-400 rounded-xl hover:text-red-500 shadow-sm border border-secondary-100 active:scale-90"><Trash2 size={14} /></button>
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-3xl bg-secondary-50 border border-secondary-100 flex items-center justify-center text-3xl font-bold text-secondary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-inner overflow-hidden">
                                        {teacher.user?.avatar && !teacher.user.avatar.includes('default.png') ? (
                                            <img src={teacher.user.avatar} alt={teacher.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            teacher.user?.name?.charAt(0)
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 border-4 border-white rounded-full shadow-sm"></div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight">{teacher.user?.name}</h3>
                                    <p className="text-primary-600 font-black text-[10px] uppercase tracking-[0.2em]">{teacher.designation || 'FACULTY MEMBER'}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-white text-accent-blue flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                        <Mail size={16} />
                                    </div>
                                    <p className="text-xs font-bold truncate">{teacher.user?.email}</p>
                                </div>
                                {user?.role !== 'teacher' && (
                                    <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                        <div className="w-9 h-9 rounded-xl bg-white text-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                            <GraduationCap size={16} />
                                        </div>
                                        <p className="text-xs font-bold truncate">{teacher.user?.department?.name || 'Academic Division'}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-white text-accent-purple flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                        <Calendar size={16} />
                                    </div>
                                    <p className="text-xs font-bold">{teacher.officeHours || '9:00 AM - 5:00 PM'}</p>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-secondary-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                    <span className="text-sm font-bold text-secondary-700 transition-colors">4.9</span>
                                    <span className="text-[10px] text-secondary-400 font-black tracking-widest uppercase transition-colors">(12 REVIEWS)</span>
                                </div>
                                <button className="flex items-center text-primary-600 font-bold text-sm group/btn uppercase tracking-widest text-[10px] transition-colors">
                                    Profile <ChevronRight size={14} className="group-hover/btn:translate-x-1 transition-transform ml-1" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Empty State */}
            {!isLoading && filteredTeachers.length === 0 && (
                <div className="bg-white border border-secondary-100 rounded-3xl py-24 text-center shadow-premium flex flex-col items-center transition-colors">
                    <div className="w-24 h-24 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-8 border border-secondary-100 transition-colors">
                        <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">Access Denied: Empty Directory</h3>
                    <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium transition-colors">We couldn't locate any faculty records matching the current parameters.</p>
                </div>
            )}

            {/* Modal */}
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
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><Plus size={20} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">
                                        {isEditing ? 'Synchroize Profile' : 'Facutly Registration'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold uppercase text-xs">✕</button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <input required className="input-field" placeholder="Dr. Sarah Connor" value={currentTeacher.name} onChange={(e) => setCurrentTeacher({ ...currentTeacher, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">University Email</label>
                                        <input required type="email" className="input-field" placeholder="sarah@university.edu" value={currentTeacher.email} onChange={(e) => setCurrentTeacher({ ...currentTeacher, email: e.target.value })} disabled={isEditing} />
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12} /> Temporary Password</label>
                                        <input required type="password" className="input-field" placeholder="••••••••" value={currentTeacher.password} onChange={(e) => setCurrentTeacher({ ...currentTeacher, password: e.target.value })} />
                                    </div>
                                )}

                                {user?.role !== 'teacher' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Designation</label>
                                            <input className="input-field" placeholder="Senior Professor" value={currentTeacher.designation} onChange={(e) => setCurrentTeacher({ ...currentTeacher, designation: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Faculty Division</label>
                                            <select required className="input-field" value={currentTeacher.department} onChange={(e) => setCurrentTeacher({ ...currentTeacher, department: e.target.value })}>
                                                <option value="">Select Division</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {user?.role === 'teacher' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Designation</label>
                                        <input className="input-field" placeholder="Senior Professor" value={currentTeacher.designation} onChange={(e) => setCurrentTeacher({ ...currentTeacher, designation: e.target.value })} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Office Hours</label>
                                        <input className="input-field" placeholder="Mon-Fri, 10-12" value={currentTeacher.officeHours} onChange={(e) => setCurrentTeacher({ ...currentTeacher, officeHours: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Qualifications</label>
                                        <input className="input-field" placeholder="PhD in AI" value={currentTeacher.qualifications} onChange={(e) => setCurrentTeacher({ ...currentTeacher, qualifications: e.target.value })} />
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={18} />
                                        {isEditing ? 'Propagate Changes' : 'Initialize Account'}
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

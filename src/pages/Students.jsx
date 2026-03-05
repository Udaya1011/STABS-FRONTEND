import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search, Mail, Calendar, GraduationCap, Plus, Users, X, Save, Edit2, Trash2, Key, Hash, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStudents, updateStudent, deleteStudent, registerStudent } from '../store/slices/studentSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { toast } from 'react-hot-toast';

const Students = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStudent, setCurrentStudent] = useState({
        name: '', email: '', password: '', registerNumber: '', department: '', academicYear: '', semester: 1
    });

    const dispatch = useDispatch();
    const { students, isLoading } = useSelector((state) => state.students);
    const { departments } = useSelector((state) => state.departments);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getStudents());
        dispatch(getDepartments());
    }, [dispatch]);

    const filteredStudents = students.filter(s =>
        (s.user?.name || 'Legacy Student').toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (s = null) => {
        if (s) {
            setIsEditing(true);
            setCurrentStudent({
                _id: s._id,
                name: s.user?.name || '',
                email: s.user?.email || '',
                registerNumber: s.registerNumber || '',
                department: s.user?.department?._id || s.user?.department || '',
                academicYear: s.academicYear || '',
                semester: s.semester || 1
            });
        } else {
            setIsEditing(false);
            setCurrentStudent({ name: '', email: '', password: '', registerNumber: '', department: '', academicYear: '', semester: 1 });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isEditing) {
            dispatch(updateStudent({ id: currentStudent._id, studentData: currentStudent }))
                .unwrap()
                .then(() => {
                    toast.success('Student profile updated');
                    setShowModal(false);
                })
                .catch(err => toast.error(err));
        } else {
            dispatch(registerStudent(currentStudent))
                .unwrap()
                .then(() => {
                    toast.success('Student registered successfully');
                    setShowModal(false);
                    dispatch(getStudents());
                })
                .catch(err => toast.error(err));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to remove this student? This will also delete their login account.')) {
            dispatch(deleteStudent(id))
                .unwrap()
                .then(() => toast.success('Student removed'))
                .catch(err => toast.error(err));
        }
    };

    return (
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 tracking-tight uppercase">Student Enrollment</h1>
                    <p className="text-secondary-500 mt-1 font-medium transition-colors">Manage student academic profiles, registrations, and departments.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by name, ID, or department..."
                        className="input-field pl-12 py-3.5"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && students.length === 0 ? (
                    [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white border border-secondary-100 h-80 rounded-3xl shadow-sm"></div>)
                ) : (
                    filteredStudents.map((s) => (
                        <motion.div
                            layout
                            key={s._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-premium group relative border-none shadow-premium hover:shadow-premium-hover transition-all duration-500"
                        >
                            {(user?.role === 'admin' || user?.role === 'teacher') && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button onClick={() => handleOpenModal(s)} className="p-2 bg-white text-secondary-400 rounded-xl hover:text-primary-600 shadow-sm border border-secondary-100 active:scale-90"><Edit2 size={14} /></button>
                                    <button onClick={() => handleDelete(s._id)} className="p-2 bg-white text-secondary-400 rounded-xl hover:text-red-500 shadow-sm border border-secondary-100 active:scale-90"><Trash2 size={14} /></button>
                                </div>
                            )}

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-3xl bg-secondary-50 border border-secondary-100 flex items-center justify-center text-3xl font-bold text-secondary-400 group-hover:bg-primary-600 group-hover:text-white transition-all duration-300 shadow-inner overflow-hidden uppercase">
                                        {s.user?.avatar && !s.user.avatar.includes('default.png') ? (
                                            <img src={s.user.avatar} alt={s.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            s.user?.name?.charAt(0) || s.registerNumber?.charAt(0) || 'S'
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 border-4 border-white rounded-full shadow-sm flex items-center justify-center text-[8px] text-white font-bold">S</div>
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight line-clamp-1">{s.user?.name || 'Academic Record'}</h3>
                                    <p className="text-primary-600 font-black text-[10px] uppercase tracking-[0.2em]">{s.registerNumber}</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-white text-accent-blue flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                        <Mail size={16} />
                                    </div>
                                    <p className="text-xs font-bold truncate">{s.user?.email || 'N/A'}</p>
                                </div>
                                {user?.role !== 'teacher' && (
                                    <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                        <div className="w-9 h-9 rounded-xl bg-white text-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                            <GraduationCap size={16} />
                                        </div>
                                        <p className="text-xs font-bold truncate">{s.user?.department?.name || 'Legacy Portfolio'}</p>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-white text-accent-purple flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                            <Calendar size={14} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase">{s.academicYear}</p>
                                    </div>
                                    <div className="flex items-center gap-3 text-secondary-600 p-2 bg-secondary-50/50 rounded-2xl border border-secondary-50 transition-colors">
                                        <div className="w-8 h-8 rounded-lg bg-white text-accent-green flex items-center justify-center flex-shrink-0 shadow-sm transition-colors">
                                            <Layers size={14} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase">SEM {s.semester}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-secondary-50 transition-colors flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-24 bg-secondary-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-primary-500" style={{ width: '85%' }}></div>
                                    </div>
                                    <span className="text-[10px] font-black text-secondary-400 transition-colors">85% ATT</span>
                                </div>
                                <button className="text-[10px] font-black text-primary-600 transition-colors uppercase tracking-widest hover:underline">Transcript</button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Bottom Add Button */}
            {(user?.role === 'admin' || user?.role === 'teacher') && (
                <div className="flex justify-center pt-10">
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-3 px-10 py-4 shadow-2xl shadow-primary-500/30 text-xs font-black uppercase tracking-[0.2em] hover:-translate-y-1 transition-transform"
                    >
                        <Plus size={20} /> Register New Student
                    </button>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredStudents.length === 0 && (
                <div className="bg-white border border-secondary-100 rounded-3xl py-24 text-center shadow-premium flex flex-col items-center transition-colors">
                    <div className="w-24 h-24 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-8 border border-secondary-100 transition-colors">
                        <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">No Students Found</h3>
                    <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium transition-colors">The student database is currently empty for the selected parameters.</p>
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
                                        {isEditing ? 'Sync Student Record' : 'Student Matriculation'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold text-xs uppercase">✕</button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Full Name</label>
                                        <input required className="input-field" placeholder="John Doe" value={currentStudent.name} onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Email</label>
                                        <input required type="email" className="input-field" placeholder="john@university.edu" value={currentStudent.email} onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })} disabled={isEditing} />
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12} /> Secure Password</label>
                                        <input required type="password" className="input-field" placeholder="••••••••" value={currentStudent.password} onChange={(e) => setCurrentStudent({ ...currentStudent, password: e.target.value })} />
                                    </div>
                                )}

                                {user?.role !== 'teacher' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={12} /> Register Number</label>
                                            <input required className="input-field" placeholder="REG2024001" value={currentStudent.registerNumber} onChange={(e) => setCurrentStudent({ ...currentStudent, registerNumber: e.target.value.toUpperCase() })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Faculty Division</label>
                                            <select required className="input-field" value={currentStudent.department} onChange={(e) => setCurrentStudent({ ...currentStudent, department: e.target.value })}>
                                                <option value="">Select Division</option>
                                                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                {user?.role === 'teacher' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={12} /> Register Number</label>
                                        <input required className="input-field" placeholder="REG2024001" value={currentStudent.registerNumber} onChange={(e) => setCurrentStudent({ ...currentStudent, registerNumber: e.target.value.toUpperCase() })} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Year</label>
                                        <input required className="input-field" placeholder="2024-2025" value={currentStudent.academicYear} onChange={(e) => setCurrentStudent({ ...currentStudent, academicYear: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Current Semester</label>
                                        <select required className="input-field" value={currentStudent.semester} onChange={(e) => setCurrentStudent({ ...currentStudent, semester: parseInt(e.target.value) })}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={18} />
                                        {isEditing ? 'Update Records' : 'Finalize Registration'}
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

export default Students;

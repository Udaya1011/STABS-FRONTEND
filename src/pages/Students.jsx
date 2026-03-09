import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getStudents, updateStudent, deleteStudent, registerStudent } from '../store/slices/studentSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { Search, Mail, Calendar, GraduationCap, Plus, Users, X, Save, Edit2, Trash2, Key, Hash, Layers, Eye, Info, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Students = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStudent, setCurrentStudent] = useState({
        name: '', email: '', password: '', registerNumber: '', department: '', academicYear: '', semester: 1
    });
    const [selectedDepartment, setSelectedDepartment] = useState('all');
    const [selectedSemester, setSelectedSemester] = useState('all');
    const [selectedYear, setSelectedYear] = useState('all');

    const dispatch = useDispatch();
    const { students, isLoading } = useSelector((state) => state.students);
    const { departments } = useSelector((state) => state.departments);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getStudents());
        dispatch(getDepartments());

        // Global Navbar Events
        const handleSearch = (e) => setSearchQuery(e.detail);
        const handleAdd = () => handleOpenModal();

        const handleFilter = (e) => setSelectedDepartment(e.detail);
        const handleSemFilter = (e) => setSelectedSemester(e.detail);
        const handleYearFilter = (e) => setSelectedYear(e.detail);

        window.addEventListener('global-search', handleSearch);
        window.addEventListener('open-add-modal', handleAdd);
        window.addEventListener('department-filter', handleFilter);
        window.addEventListener('semester-filter', handleSemFilter);
        window.addEventListener('year-filter', handleYearFilter);

        return () => {
            window.removeEventListener('global-search', handleSearch);
            window.removeEventListener('open-add-modal', handleAdd);
            window.removeEventListener('department-filter', handleFilter);
            window.removeEventListener('semester-filter', handleSemFilter);
            window.removeEventListener('year-filter', handleYearFilter);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch]);

    const filteredStudents = students.filter(s => {
        const matchesSearch = (s.user?.name || 'Legacy Student').toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.registerNumber?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesDep = selectedDepartment === 'all' || (s.user?.department?._id || s.user?.department) === selectedDepartment;
        const matchesSem = selectedSemester === 'all' || s.semester === parseInt(selectedSemester);
        const matchesYear = selectedYear === 'all' || s.academicYear === selectedYear;

        return matchesSearch && matchesDep && matchesSem && matchesYear;
    });

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

    const handleView = (s) => {
        setSelectedStudent(s);
        setShowSidePanel(true);
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


            <div className="bg-white rounded-3xl shadow-premium border border-secondary-100 overflow-hidden">
                <div className="overflow-x-auto" style={{ height: '600px', overflowY: 'auto' }}>
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-secondary-50/50 sticky top-0 z-10 backdrop-blur-md border-b border-secondary-100">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-secondary-500 uppercase tracking-widest">Student</th>
                                <th className="py-4 px-6 text-xs font-bold text-secondary-500 uppercase tracking-widest">Reg Number</th>
                                <th className="py-4 px-6 text-xs font-bold text-secondary-500 uppercase tracking-widest">Email</th>
                                <th className="py-4 px-6 text-xs font-bold text-secondary-500 uppercase tracking-widest text-center">Division</th>
                                <th className="py-4 px-6 text-xs font-bold text-secondary-500 uppercase tracking-widest text-center">Batch Plan</th>
                                <th className="py-4 px-6 text-xs font-bold text-secondary-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-secondary-50">
                            {isLoading && students.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Synchronizing records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-4 border border-secondary-100"><Users size={32} /></div>
                                            <h3 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Access Controlled Hub</h3>
                                            <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium">No scholarship profiles or matriculation records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((s) => (
                                    <tr key={s._id} className="hover:bg-secondary-50/50 transition-all group">
                                        <td className="py-4 px-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-secondary-50 flex items-center justify-center text-sm font-bold text-secondary-400 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-sm shrink-0 overflow-hidden uppercase border border-secondary-100">
                                                    {s.user?.avatar && !s.user.avatar.includes('default.png') ? (
                                                        <img src={s.user.avatar} alt={s.user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        s.user?.name?.charAt(0) || s.registerNumber?.charAt(0) || 'S'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-secondary-900 transition-colors group-hover:text-primary-600">{s.user?.name || 'Academic Record'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-[11px] font-black text-secondary-700 tracking-wider font-mono bg-secondary-50 px-2 py-1 rounded border border-secondary-100 uppercase">{s.registerNumber}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="text-xs font-medium text-secondary-600 truncate max-w-[150px] inline-block">{s.user?.email || 'N/A'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-xs font-bold text-secondary-700">{s.user?.department?.name || 'General Batch'}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-primary-50 text-primary-600 text-[10px] font-bold uppercase tracking-widest border border-primary-100">
                                                    Yr {s.academicYear}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest border border-purple-100">
                                                    Sem {s.semester}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-8 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleView(s)}
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm border border-emerald-100/50"
                                                    title="View Profile"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {(user?.role === 'admin' || user?.role === 'teacher') && (
                                                    <>
                                                        <button onClick={() => handleOpenModal(s)} className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all shadow-sm border border-primary-100/50" title="Edit">
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button onClick={() => handleDelete(s._id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm border border-red-100/50" title="Delete">
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
            </div>


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
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><Plus size={20} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">
                                        {isEditing ? 'Sync Matrix Record' : 'Student Matriculation Hub'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold text-xs uppercase">✕</button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Full Name<span className="text-red-500">*</span></label>
                                        <input required className="input-field" placeholder="John Doe" value={currentStudent.name} onChange={(e) => setCurrentStudent({ ...currentStudent, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Email<span className="text-red-500">*</span></label>
                                        <input required type="email" className="input-field" placeholder="john@university.edu" value={currentStudent.email} onChange={(e) => setCurrentStudent({ ...currentStudent, email: e.target.value })} disabled={isEditing} />
                                    </div>
                                </div>

                                {!isEditing && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={12} /> Access Password<span className="text-red-500">*</span></label>
                                        <input required type="password" className="input-field" placeholder="••••••••" value={currentStudent.password} onChange={(e) => setCurrentStudent({ ...currentStudent, password: e.target.value })} />
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Hash size={12} /> Matrix ID (Reg No)<span className="text-red-500">*</span></label>
                                        <input required className="input-field" placeholder="REG2024001" value={currentStudent.registerNumber} onChange={(e) => setCurrentStudent({ ...currentStudent, registerNumber: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Division<span className="text-red-500">*</span></label>
                                        <select required className="input-field cursor-pointer font-bold text-secondary-700" value={currentStudent.department} onChange={(e) => setCurrentStudent({ ...currentStudent, department: e.target.value })}>
                                            <option value="">Select Portfolio</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Batch Start</label>
                                        <input required className="input-field" placeholder="2024-2025" value={currentStudent.academicYear} onChange={(e) => setCurrentStudent({ ...currentStudent, academicYear: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Semester</label>
                                        <select required className="input-field cursor-pointer" value={currentStudent.semester} onChange={(e) => setCurrentStudent({ ...currentStudent, semester: parseInt(e.target.value) })}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={18} />
                                        {isEditing ? 'Synchroize Node' : 'Initialize Profile'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Side Panel for Student Details */}
            <AnimatePresence>
                {showSidePanel && selectedStudent && (
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
                            className="relative w-full max-w-lg bg-white h-screen shadow-2xl overflow-y-auto"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                                            <UserCheck size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tight">{selectedStudent.user?.name || 'Legacy Profile'}</h3>
                                            <p className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">{selectedStudent.registerNumber}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowSidePanel(false)} className="p-2 text-secondary-400 hover:text-secondary-900 rounded-xl transition-all">
                                        <X size={24} strokeWidth={3} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-secondary-50/50 rounded-[2rem] p-8 border border-secondary-100">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                                            <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Academic Matrix</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Division</p>
                                                <p className="text-sm font-bold text-secondary-900">{selectedStudent.user?.department?.name || 'General Batch'}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Entry Year</p>
                                                <p className="text-sm font-bold text-secondary-900">{selectedStudent.academicYear}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white p-6 rounded-[2rem] border border-secondary-100 shadow-sm flex flex-col items-center text-center group hover:border-primary-200 transition-all">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Layers size={24} /></div>
                                            <p className="text-2xl font-black text-secondary-900">{selectedStudent.semester}</p>
                                            <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-[0.1em]">Current Sem</p>
                                        </div>
                                        <div className="bg-white p-6 rounded-[2rem] border border-secondary-100 shadow-sm flex flex-col items-center text-center group hover:border-accent-blue-200 transition-all">
                                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3 group-hover:scale-110 transition-transform"><Mail size={24} /></div>
                                            <p className="text-xs font-bold text-secondary-600 truncate max-w-full italic px-2">{selectedStudent.user?.email || 'No Email'}</p>
                                            <p className="text-[9px] font-bold text-secondary-400 uppercase tracking-[0.1em] mt-1">Registry Contact</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Info size={14} className="text-secondary-400" />
                                            <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Compliance Profile</h4>
                                        </div>
                                        <div className="p-6 bg-white rounded-[2rem] border border-secondary-100 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">Verification Status</span>
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-tighter rounded-full border border-emerald-100">Authenticated</span>
                                            </div>
                                            <p className="text-xs text-secondary-500 font-medium leading-relaxed">
                                                This student profile has been verified by the registrar office and is synchronized with the primary academic database.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-secondary-100">
                                    <button 
                                        onClick={() => { handleOpenModal(selectedStudent); setShowSidePanel(false); }}
                                        className="w-full py-4 bg-secondary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Edit2 size={16} /> Sync Profile Node
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Students;

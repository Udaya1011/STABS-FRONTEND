import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../store/slices/subjectSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { getTeachers } from '../store/slices/teacherSlice';
import { BookOpen, Plus, X, Save, Edit2, Trash2, Eye, Info, Building2, ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Subjects = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDepId, setSelectedDepId] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(8);
    const [showModal, setShowModal] = useState(false);
    const [showSidePanel, setShowSidePanel] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSubject, setCurrentSubject] = useState({ name: '', code: '', department: '', year: 1, semester: 1, teachers: [] });

    const dispatch = useDispatch();
    const { subjects, isLoading } = useSelector((state) => state.subjects);
    const { departments } = useSelector((state) => state.departments);
    const { teachers } = useSelector((state) => state.teachers);
    const { user } = useSelector((state) => state.auth);

    const handleOpenModal = (sub = null) => {
        if (sub) {
            setIsEditing(true);
            setCurrentSubject({
                ...sub,
                department: sub.department?._id || sub.department,
                teachers: sub.teachers?.map(t => t._id) || []
            });
        } else {
            setIsEditing(false);
            setCurrentSubject({ name: '', code: '', department: '', year: 1, semester: 1, teachers: [] });
        }
        setShowModal(true);
    };

    const handleView = (sub) => {
        setSelectedSubject(sub);
        setShowSidePanel(true);
    };

    useEffect(() => {
        dispatch(getSubjects());
        dispatch(getDepartments());
        dispatch(getTeachers());

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
    }, [dispatch]);

    const filteredSubjects = subjects.filter(sub => {
        const matchesSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDep = selectedDepId === 'all' || (sub.department?._id || sub.department) === selectedDepId;
        return matchesSearch && matchesDep;
    });

    const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);
    const currentItems = filteredSubjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedDepId]);

    const handleSave = async (e) => {
        if (e) e.preventDefault();

        const subjectData = {
            ...currentSubject,
            code: currentSubject.code || `${currentSubject.name?.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
            teachers: Array.isArray(currentSubject.teachers) ? currentSubject.teachers : []
        };

        if (isEditing) {
            dispatch(updateSubject({ id: currentSubject._id, subjectData }))
                .unwrap()
                .then(() => {
                    toast.success('Subject updated!');
                    setShowModal(false);
                    dispatch(getSubjects());
                    dispatch(getDepartments());
                })
                .catch(err => toast.error(err));
        } else {
            dispatch(createSubject(subjectData))
                .unwrap()
                .then(() => {
                    toast.success('Subject created!');
                    setShowModal(false);
                    dispatch(getSubjects());
                    dispatch(getDepartments());
                })
                .catch(err => toast.error(err));
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this subject?')) {
            dispatch(deleteSubject(id))
                .unwrap()
                .then(() => toast.success('Subject removed'))
                .catch(err => toast.error(err));
        }
    };
    return (
        <div className="flex-1 flex flex-col min-h-0 -mt-2">
            <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl shadow-primary-500/10 border border-primary-100 overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar min-h-0">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead className="bg-primary-600 sticky top-0 z-10 border-b border-primary-700 shadow-sm">
                            <tr>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest w-20 text-center">#</th>
                                <th className="py-4 px-8 text-xs font-bold text-white uppercase tracking-widest text-center">Subject</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-28">Year</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center w-28">Sem</th>
                                <th className="py-4 px-6 text-xs font-bold text-white uppercase tracking-widest text-center">Programme</th>
                                <th className="py-4 px-4 text-xs font-bold text-white uppercase tracking-widest text-center w-28">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary-300">
                            {isLoading && subjects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4"></div>
                                            <p className="text-[10px] font-bold text-secondary-400 uppercase tracking-widest">Synchronizing records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredSubjects.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-16 h-16 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-4 border border-secondary-100"><BookOpen size={32} /></div>
                                            <p className="text-secondary-500 font-medium">No subjects identified in the current sector.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((sub, index) => (
                                    <tr key={sub._id} className="even:bg-primary-50/30 hover:bg-primary-50/40 transition-all group">
                                        <td className="py-4 px-6 text-center text-xs font-bold text-secondary-400 uppercase">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="py-4 px-8 text-center">
                                            <p className="text-sm font-bold text-secondary-900 transition-colors group-hover:text-primary-600 uppercase tracking-tight">{sub.name}</p>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-[10px] font-black text-primary-600 tracking-wider uppercase bg-primary-50 px-3 py-1 rounded border border-primary-100">
                                                YEAR {sub.year}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-[10px] font-black text-secondary-600 tracking-wider uppercase bg-secondary-50 px-3 py-1 rounded border border-secondary-100">
                                                SEM {sub.semester}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <span className="text-[10px] font-black text-primary-600 tracking-wider uppercase bg-primary-50 px-3 py-1 rounded border border-primary-100 font-mono">
                                                {sub.department?.programme || sub.department?.name || '---'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button 
                                                    onClick={() => handleView(sub)} 
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all shadow-sm border border-emerald-100/50" 
                                                    title="View Specifications"
                                                >
                                                    <Eye size={15} />
                                                </button>
                                                {user?.role === 'admin' && (
                                                    <>
                                                        <button 
                                                            onClick={() => handleOpenModal(sub)} 
                                                            className="p-2 text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-all shadow-sm border border-primary-100/50" 
                                                            title="Edit Specifications"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(sub._id)} 
                                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all shadow-sm border border-red-100/50" 
                                                            title="Delete Record"
                                                        >
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

            {/* Modal & Side Panel Intact */}
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
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight">Sync Module</h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all font-bold text-xs uppercase">✕</button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Module Title<span className="text-red-500">*</span></label>
                                    <input required className="input-field" placeholder="e.g. Advanced Calculus" value={currentSubject.name} onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })} />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Programme<span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            className="input-field cursor-pointer"
                                            value={currentSubject.department}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, department: e.target.value })}
                                        >
                                            <option value="">Select Programme</option>
                                            {departments.map(d => (
                                                <option key={d._id} value={d._id}>{d.programme || d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Faculty</label>
                                        <select
                                            className="input-field cursor-pointer"
                                            value={currentSubject.teachers?.[0] || ''}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, teachers: e.target.value ? [e.target.value] : [] })}
                                        >
                                            <option value="">Select Faculty</option>
                                            {teachers.map(t => <option key={t._id} value={t.user?._id || t._id}>{t.user?.name || t.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Year</label>
                                        <select className="input-field cursor-pointer" value={currentSubject.year} onChange={(e) => setCurrentSubject({ ...currentSubject, year: parseInt(e.target.value) })}>
                                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Semester Cycle</label>
                                        <select className="input-field cursor-pointer" value={currentSubject.semester} onChange={(e) => setCurrentSubject({ ...currentSubject, semester: parseInt(e.target.value) })}>
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8 font-black uppercase tracking-widest text-[10px]">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20 font-black uppercase tracking-widest text-[10px]">
                                        <Save size={18} />
                                        Initialize
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Side Panel */}
            <AnimatePresence>
                {showSidePanel && selectedSubject && (
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
                                            <BookOpen size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-secondary-900 uppercase tracking-tight">{selectedSubject.name}</h3>
                                            <p className="text-xs font-black text-primary-600 uppercase tracking-[0.2em]">{selectedSubject.code}</p>
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
                                            <h4 className="text-[10px] font-black text-secondary-400 uppercase tracking-[0.2em]">Module Specs</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Academic Year</p>
                                                <p className="text-sm font-bold text-secondary-900">Year {selectedSubject.year}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-black text-secondary-400 uppercase tracking-widest">Semester</p>
                                                <p className="text-sm font-bold text-secondary-900">Period {selectedSubject.semester}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-8 border-t border-secondary-100">
                                    <button
                                        onClick={() => { handleOpenModal(selectedSubject); setShowSidePanel(false); }}
                                        className="w-full py-4 bg-secondary-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-primary-600 transition-all shadow-xl shadow-secondary-900/20 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        <Edit2 size={16} /> Sync Module Data
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

export default Subjects;

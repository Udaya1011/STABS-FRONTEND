import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../store/slices/subjectSlice';
import { getDepartments } from '../store/slices/departmentSlice';
import { BookOpen, Users, Clock, Plus, Search, Layers, GraduationCap, X, Save, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const Subjects = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentSubject, setCurrentSubject] = useState({
        name: '', code: '', department: '', year: 1, semester: 1
    });

    const dispatch = useDispatch();
    const { subjects, isLoading } = useSelector((state) => state.subjects);
    const { departments } = useSelector((state) => state.departments);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(getSubjects());
        dispatch(getDepartments());
    }, [dispatch]);

    const filteredSubjects = subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenModal = (sub = null) => {
        if (sub) {
            setIsEditing(true);
            setCurrentSubject({
                ...sub,
                department: sub.department?._id || sub.department
            });
        } else {
            setIsEditing(false);
            setCurrentSubject({ name: '', code: '', department: '', year: 1, semester: 1 });
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (isEditing) {
            dispatch(updateSubject({ id: currentSubject._id, subjectData: currentSubject }))
                .unwrap()
                .then(() => {
                    toast.success('Subject updated');
                    setShowModal(false);
                })
                .catch(err => toast.error(err));
        } else {
            dispatch(createSubject(currentSubject))
                .unwrap()
                .then(() => {
                    toast.success('Subject created');
                    setShowModal(false);
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
        <div className="space-y-8 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-secondary-900 tracking-tight uppercase">Academic Curriculum</h1>
                    <p className="text-secondary-500 mt-1 font-medium">Manage core subjects, prerequisites, and learning pathways.</p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-primary flex items-center gap-2 shadow-xl shadow-primary-500/20"
                    >
                        <Plus size={20} />
                        Add New Subject
                    </button>
                )}
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-400" size={18} />
                <input
                    type="text"
                    placeholder="Search by subject name or code..."
                    className="input-field pl-12 py-3.5"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoading && subjects.length === 0 ? (
                    [1, 2, 3].map(i => <div key={i} className="animate-pulse bg-white border border-secondary-100 h-64 rounded-3xl shadow-sm"></div>)
                ) : (
                    filteredSubjects.map((sub) => (
                        <motion.div
                            layout
                            key={sub._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="card-premium flex flex-col justify-between group relative overflow-hidden"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="p-3 bg-primary-50 text-primary-600 rounded-2xl border border-primary-100 shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                                        <BookOpen size={24} />
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-2.5 py-1 rounded-lg bg-secondary-900 text-white text-[10px] font-bold uppercase tracking-widest shadow-sm">S-{sub.semester}</span>
                                        {user?.role === 'admin' && (
                                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleOpenModal(sub)} className="p-1.5 bg-white text-secondary-400 rounded-lg hover:text-primary-600 shadow-sm border border-secondary-100"><Edit2 size={14} /></button>
                                                <button onClick={() => handleDelete(sub._id)} className="p-1.5 bg-white text-secondary-400 rounded-lg hover:text-red-500 shadow-sm border border-secondary-100"><Trash2 size={14} /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-secondary-900 group-hover:text-primary-600 transition-colors uppercase tracking-tight line-clamp-1">{sub.name}</h3>
                                    <p className="text-xs font-black text-secondary-400 mt-1 tracking-[0.2em] uppercase">{sub.code}</p>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center gap-3 p-3 bg-secondary-50 rounded-2xl border border-secondary-100">
                                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-primary-600 shadow-sm transition-colors"><GraduationCap size={16} /></div>
                                    <span className="text-xs font-bold text-secondary-700 truncate transition-colors">{sub.department?.name || 'Central Faculty'}</span>
                                </div>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-2">
                                        <div className="px-3 py-1 bg-blue-50 text-accent-blue rounded-full text-[10px] font-bold border border-blue-100">YEAR {sub.year}</div>
                                    </div>
                                    <button className="text-xs font-black text-primary-600 uppercase tracking-widest hover:underline">Resources</button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Empty State */}
            {!isLoading && filteredSubjects.length === 0 && (
                <div className="bg-white border border-secondary-100 rounded-3xl py-24 text-center shadow-premium flex flex-col items-center transition-colors">
                    <div className="w-24 h-24 bg-secondary-50 text-secondary-200 rounded-full flex items-center justify-center mb-8 border border-secondary-100">
                        <BookOpen size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-secondary-900 uppercase tracking-tight">No Academic Modules</h3>
                    <p className="text-secondary-500 mt-2 max-w-sm mx-auto font-medium">The curriculum repository is currently empty for this selection.</p>
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
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 border border-secondary-100"
                        >
                            <div className="px-8 py-6 bg-secondary-50 border-b border-secondary-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-primary-600 text-white rounded-lg"><BookOpen size={20} /></div>
                                    <h2 className="text-xl font-bold text-secondary-900 uppercase tracking-tight transition-colors">
                                        {isEditing ? 'Sync Subject Data' : 'New Academic Subject'}
                                    </h2>
                                </div>
                                <button onClick={() => setShowModal(false)} className="p-2 text-secondary-400 hover:text-secondary-600 rounded-xl transition-all"><X size={20} /></button>
                            </div>

                            <form onSubmit={handleSave} className="p-8 space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Subject Title</label>
                                    <input
                                        required
                                        className="input-field"
                                        placeholder="e.g. Advanced Data Structures"
                                        value={currentSubject.name}
                                        onChange={(e) => setCurrentSubject({ ...currentSubject, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Subject Code</label>
                                        <input
                                            required
                                            className="input-field"
                                            placeholder="e.g. CS301"
                                            value={currentSubject.code}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Academic Year</label>
                                        <select
                                            className="input-field"
                                            value={currentSubject.year}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, year: parseInt(e.target.value) })}
                                        >
                                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Semester</label>
                                        <select
                                            className="input-field"
                                            value={currentSubject.semester}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, semester: parseInt(e.target.value) })}
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-secondary-500 uppercase tracking-widest ml-1">Faculty Division</label>
                                        <select
                                            required
                                            className="input-field"
                                            value={currentSubject.department}
                                            onChange={(e) => setCurrentSubject({ ...currentSubject, department: e.target.value })}
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-8">Discard</button>
                                    <button type="submit" className="btn-primary flex items-center gap-2 px-10 shadow-lg shadow-primary-500/20">
                                        <Save size={18} />
                                        {isEditing ? 'Commit Changes' : 'Publish Subject'}
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

export default Subjects;

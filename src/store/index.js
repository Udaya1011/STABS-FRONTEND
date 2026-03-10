import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import departmentReducer from './slices/departmentSlice';
import subjectReducer from './slices/subjectSlice';
import teacherReducer from './slices/teacherSlice';
import studentReducer from './slices/studentSlice';
import appointmentReducer from './slices/appointmentSlice';
import messageReducer from './slices/messageSlice';
import notificationReducer from './slices/notificationSlice';
import registryReducer from './slices/registrySlice';
import attendanceReducer from './slices/attendanceSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        departments: departmentReducer,
        subjects: subjectReducer,
        teachers: teacherReducer,
        students: studentReducer,
        appointments: appointmentReducer,
        messages: messageReducer,
        notifications: notificationReducer,
        registry: registryReducer,
        attendance: attendanceReducer
    },
});

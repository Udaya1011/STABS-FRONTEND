import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5006/api';

// Submit Attendance
export const submitAttendance = createAsyncThunk(
    'attendance/submit',
    async (attendanceData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.post(`${API_URL}/attendance`, attendanceData, config);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get Subject Attendance Records
export const getSubjectAttendance = createAsyncThunk(
    'attendance/getSubjectRecords',
    async (subjectId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(`${API_URL}/attendance/subject/${subjectId}`, config);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get Student Attendance History
export const getStudentAttendance = createAsyncThunk(
    'attendance/getStudentHistory',
    async (studentId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(`${API_URL}/attendance/student/${studentId}`, config);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const attendanceSlice = createSlice({
    name: 'attendance',
    initialState: {
        records: [],
        subjectHistory: [],
        studentHistory: [],
        isLoading: false,
        isSuccess: false,
        isError: false,
        message: '',
    },
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitAttendance.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(submitAttendance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
            })
            .addCase(submitAttendance.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getSubjectAttendance.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSubjectAttendance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subjectHistory = action.payload.data;
            })
            .addCase(getStudentAttendance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.studentHistory = action.payload.data;
            });
    },
});

export const { reset } = attendanceSlice.actions;
export default attendanceSlice.reducer;

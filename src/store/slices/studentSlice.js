import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/students';

const initialState = {
    students: [],
    isLoading: false,
    isError: false,
    message: '',
};

const getAuthHeader = (thunkAPI) => {
    const user = thunkAPI.getState().auth.user;
    const token = user?.token;
    if (token) {
        return { headers: { Authorization: `Bearer ${token}` } };
    }
    return {};
};

export const getStudents = createAsyncThunk('students/getAll', async (query = '', thunkAPI) => {
    try {
        const url = query ? `${API_URL}?${query}` : API_URL;
        return (await axios.get(url, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch students');
    }
});

export const updateStudent = createAsyncThunk('students/update', async ({ id, studentData }, thunkAPI) => {
    try {
        return (await axios.put(`${API_URL}/${id}`, studentData, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update student');
    }
});

export const deleteStudent = createAsyncThunk('students/delete', async (id, thunkAPI) => {
    try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeader(thunkAPI));
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete student');
    }
});

export const registerStudent = createAsyncThunk('students/register', async (studentData, thunkAPI) => {
    try {
        const response = await axios.post('/api/auth/register', { ...studentData, role: 'student' });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to register student');
    }
});

export const studentSlice = createSlice({
    name: 'students',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getStudents.pending, (state) => { state.isLoading = true; })
            .addCase(getStudents.fulfilled, (state, action) => {
                state.isLoading = false;
                state.students = action.payload;
            })
            .addCase(getStudents.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteStudent.fulfilled, (state, action) => {
                state.isLoading = false;
                state.students = state.students.filter(s => s._id !== action.payload);
            })
            .addCase(updateStudent.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.students.findIndex(s => s._id === action.payload._id);
                if (index !== -1) state.students[index] = action.payload;
            });
    },
});

export const { reset } = studentSlice.actions;
export default studentSlice.reducer;

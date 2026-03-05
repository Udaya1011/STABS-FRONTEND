import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/teachers';

const initialState = {
    teachers: [],
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

export const getTeachers = createAsyncThunk('teachers/getAll', async (_, thunkAPI) => {
    try {
        return (await axios.get(API_URL, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch teachers');
    }
});

export const updateTeacher = createAsyncThunk('teachers/update', async ({ id, teacherData }, thunkAPI) => {
    try {
        return (await axios.put(`${API_URL}/${id}`, teacherData, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update teacher');
    }
});

export const deleteTeacher = createAsyncThunk('teachers/delete', async (id, thunkAPI) => {
    try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeader(thunkAPI));
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete teacher');
    }
});

export const registerTeacher = createAsyncThunk('teachers/register', async (teacherData, thunkAPI) => {
    try {
        // We use the auth register endpoint but with teacher role
        const response = await axios.post('/api/auth/register', { ...teacherData, role: 'teacher' });
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to register teacher');
    }
});

export const teacherSlice = createSlice({
    name: 'teachers',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getTeachers.pending, (state) => { state.isLoading = true; })
            .addCase(getTeachers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teachers = action.payload;
            })
            .addCase(getTeachers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteTeacher.fulfilled, (state, action) => {
                state.isLoading = false;
                state.teachers = state.teachers.filter(t => t._id !== action.payload);
            })
            .addCase(updateTeacher.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.teachers.findIndex(t => t._id === action.payload._id);
                if (index !== -1) state.teachers[index] = action.payload;
            });
    },
});

export const { reset } = teacherSlice.actions;
export default teacherSlice.reducer;

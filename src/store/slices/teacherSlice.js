import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/teachers';

const initialState = {
    teachers: [],
    currentTeacherProfile: null,
    isLoading: false,
    isError: false,
    message: '',
};

const getAuthHeader = (thunkAPI) => {
    const state = thunkAPI.getState();
    const token = state.auth.user?.token;
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

export const getMyProfile = createAsyncThunk('teachers/getMyProfile', async (_, thunkAPI) => {
    try {
        return (await axios.get(`${API_URL}/profile`, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
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

export const updateMyAvailability = createAsyncThunk('teachers/updateAvailability', async (availability, thunkAPI) => {
    try {
        return (await axios.put(`${API_URL}/availability`, { availability }, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update availability');
    }
});

export const syncMyFreeSlots = createAsyncThunk('teachers/syncSlots', async (_, thunkAPI) => {
    try {
        return (await axios.post(`${API_URL}/sync-slots`, {}, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to sync free slots');
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
            })
            .addCase(getMyProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentTeacherProfile = action.payload;
            })
            .addCase(updateMyAvailability.fulfilled, (state, action) => {
                state.isLoading = false;
                state.currentTeacherProfile = action.payload;
                // Also update in teachers list if present
                const index = state.teachers.findIndex(t => t._id === action.payload._id);
                if (index !== -1) state.teachers[index] = action.payload;
            })
            .addCase(syncMyFreeSlots.pending, (state) => { state.isLoading = true; })
            .addCase(syncMyFreeSlots.fulfilled, (state) => { state.isLoading = false; })
            .addCase(syncMyFreeSlots.rejected, (state, action) => {
                state.isLoading = false;
                state.message = action.payload;
            });
    },
});

export const { reset } = teacherSlice.actions;
export default teacherSlice.reducer;

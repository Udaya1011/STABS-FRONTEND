import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/subjects';

const initialState = {
    subjects: [],
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

export const getSubjects = createAsyncThunk('subjects/getAll', async (_, thunkAPI) => {
    try {
        return (await axios.get(API_URL, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch subjects');
    }
});

export const createSubject = createAsyncThunk('subjects/create', async (subjectData, thunkAPI) => {
    try {
        return (await axios.post(API_URL, subjectData, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create subject');
    }
});

export const updateSubject = createAsyncThunk('subjects/update', async ({ id, subjectData }, thunkAPI) => {
    try {
        return (await axios.put(`${API_URL}/${id}`, subjectData, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update subject');
    }
});

export const deleteSubject = createAsyncThunk('subjects/delete', async (id, thunkAPI) => {
    try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeader(thunkAPI));
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete subject');
    }
});

export const subjectSlice = createSlice({
    name: 'subjects',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getSubjects.pending, (state) => { state.isLoading = true; })
            .addCase(getSubjects.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subjects = action.payload;
            })
            .addCase(getSubjects.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createSubject.pending, (state) => { state.isLoading = true; })
            .addCase(createSubject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subjects.push(action.payload);
            })
            .addCase(updateSubject.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.subjects.findIndex(s => s._id === action.payload._id);
                if (index !== -1) state.subjects[index] = action.payload;
            })
            .addCase(deleteSubject.fulfilled, (state, action) => {
                state.isLoading = false;
                state.subjects = state.subjects.filter(s => s._id !== action.payload);
            });
    },
});

export const { reset } = subjectSlice.actions;
export default subjectSlice.reducer;

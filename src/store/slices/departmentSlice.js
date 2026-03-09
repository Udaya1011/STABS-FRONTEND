import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/departments';

const initialState = {
    departments: [],
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

export const getDepartments = createAsyncThunk('departments/getAll', async (_, thunkAPI) => {
    try {
        return (await axios.get(API_URL, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch departments');
    }
});

export const createDepartment = createAsyncThunk('departments/create', async (departmentData, thunkAPI) => {
    try {
        return (await axios.post(API_URL, departmentData, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create department');
    }
});

export const updateDepartment = createAsyncThunk('departments/update', async ({ id, departmentData }, thunkAPI) => {
    try {
        return (await axios.put(`${API_URL}/${id}`, departmentData, getAuthHeader(thunkAPI))).data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update department');
    }
});

export const deleteDepartment = createAsyncThunk('departments/delete', async (id, thunkAPI) => {
    try {
        await axios.delete(`${API_URL}/${id}`, getAuthHeader(thunkAPI));
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete department');
    }
});

export const departmentSlice = createSlice({
    name: 'departments',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            // Get Departments
            .addCase(getDepartments.pending, (state) => { state.isLoading = true; })
            .addCase(getDepartments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.departments = action.payload;
            })
            .addCase(getDepartments.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create Department
            .addCase(createDepartment.pending, (state) => { state.isLoading = true; })
            .addCase(createDepartment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.departments.push(action.payload);
            })
            .addCase(createDepartment.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Department
            .addCase(updateDepartment.pending, (state) => { state.isLoading = true; })
            .addCase(updateDepartment.fulfilled, (state, action) => {
                state.isLoading = false;
                const index = state.departments.findIndex(d => d._id === action.payload._id);
                if (index !== -1) state.departments[index] = action.payload;
            })
            .addCase(updateDepartment.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete Department
            .addCase(deleteDepartment.fulfilled, (state, action) => {
                state.isLoading = false;
                state.departments = state.departments.filter(d => d._id !== action.payload);
            });
    },
});

export const { reset } = departmentSlice.actions;
export default departmentSlice.reducer;

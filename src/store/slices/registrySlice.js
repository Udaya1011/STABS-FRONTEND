import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5005/api';

export const getRegistry = createAsyncThunk('registry/get', async (_, thunkAPI) => {
    try {
        const response = await axios.get(`${API_URL}/registry`);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const addRegistryItem = createAsyncThunk('registry/add', async (data, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(`${API_URL}/registry/add`, data, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const removeRegistryItem = createAsyncThunk('registry/remove', async (data, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(`${API_URL}/registry/remove`, data, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

const registrySlice = createSlice({
    name: 'registry',
    initialState: {
        blocks: [],
        years: [],
        rooms: [],
        isLoading: false,
        error: null
    },
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getRegistry.pending, (state) => { state.isLoading = true; })
            .addCase(getRegistry.fulfilled, (state, action) => {
                state.isLoading = false;
                state.blocks = action.payload.blocks || [];
                state.years = action.payload.years || [];
                state.rooms = action.payload.rooms || [];
            })
            .addCase(getRegistry.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            .addCase(addRegistryItem.fulfilled, (state, action) => {
                state.blocks = action.payload.blocks || [];
                state.years = action.payload.years || [];
                state.rooms = action.payload.rooms || [];
            })
            .addCase(removeRegistryItem.fulfilled, (state, action) => {
                state.blocks = action.payload.blocks || [];
                state.years = action.payload.years || [];
                state.rooms = action.payload.rooms || [];
            });
    }
});

export default registrySlice.reducer;

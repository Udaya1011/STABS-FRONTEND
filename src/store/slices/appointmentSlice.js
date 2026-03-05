import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/appointments';

const initialState = {
    appointments: [],
    availableSlots: [],
    isLoading: false,
    isError: false,
    message: '',
};

export const getMyAppointments = createAsyncThunk('appointments/getMy', async (_, thunkAPI) => {
    try {
        const user = thunkAPI.getState().auth.user;
        const token = user?.token;
        if (!token) return thunkAPI.rejectWithValue('Not authorized, no token in state');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const bookAppointment = createAsyncThunk('appointments/book', async (appointmentData, thunkAPI) => {
    try {
        const user = thunkAPI.getState().auth.user;
        const token = user?.token;
        if (!token) return thunkAPI.rejectWithValue('Not authorized, no token in state');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(API_URL, appointmentData, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const createFreeSlot = createAsyncThunk('appointments/createSlot', async (slotData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(`${API_URL}/slots`, slotData, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const getAvailableSlots = createAsyncThunk('appointments/getSlots', async (_, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/slots`, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const bookAvailableSlot = createAsyncThunk('appointments/bookSlot', async ({ id, bookingData }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`${API_URL}/slots/${id}/book`, bookingData, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const updateAppointmentStatus = createAsyncThunk('appointments/updateStatus', async ({ id, statusData }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`${API_URL}/${id}/status`, statusData, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const appointmentSlice = createSlice({
    name: 'appointments',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMyAppointments.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getMyAppointments.fulfilled, (state, action) => {
                state.isLoading = false;
                state.appointments = action.payload;
            })
            .addCase(getMyAppointments.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(bookAppointment.fulfilled, (state, action) => {
                state.appointments.push(action.payload);
            })
            .addCase(createFreeSlot.fulfilled, (state, action) => {
                state.appointments.push(action.payload);
            })
            .addCase(getAvailableSlots.fulfilled, (state, action) => {
                state.availableSlots = action.payload;
            })
            .addCase(bookAvailableSlot.fulfilled, (state, action) => {
                state.appointments.push(action.payload);
                state.availableSlots = state.availableSlots.filter(s => s._id !== action.payload._id);
            })
            .addCase(updateAppointmentStatus.fulfilled, (state, action) => {
                const index = state.appointments.findIndex(a => a._id === action.payload._id);
                if (index !== -1) {
                    state.appointments[index] = action.payload;
                }
            });
    },
});

export const { reset } = appointmentSlice.actions;
export default appointmentSlice.reducer;

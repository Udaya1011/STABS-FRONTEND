import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/notifications';

const initialState = {
    notifications: [],
    isLoading: false,
    isError: false,
    message: '',
};

export const getMyNotifications = createAsyncThunk('notifications/getMy', async (_, thunkAPI) => {
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

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user?.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.put(`${API_URL}/${id}/read`, {}, config);
        return id;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const notificationSlice = createSlice({
    name: 'notifications',
    initialState,
    reducers: {
        reset: (state) => initialState,
        addNotification: (state, action) => {
            state.notifications.unshift(action.payload);
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMyNotifications.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getMyNotifications.fulfilled, (state, action) => {
                state.isLoading = false;
                state.notifications = action.payload;
            })
            .addCase(getMyNotifications.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(markAsRead.fulfilled, (state, action) => {
                const index = state.notifications.findIndex(n => n._id === action.payload);
                if (index !== -1) {
                    state.notifications[index].isRead = true;
                }
            });
    },
});

export const { reset, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

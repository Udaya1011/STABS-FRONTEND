import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = '/api/messages';

const initialState = {
    messages: [],
    unreadCounts: {}, // { senderId: count }
    isLoading: false,
    isError: false,
    message: '',
};

export const getMessages = createAsyncThunk('messages/get', async (userId, thunkAPI) => {
    try {
        const user = thunkAPI.getState().auth.user;
        const token = user?.token;
        if (!token) return thunkAPI.rejectWithValue('Not authorized, no token in state');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/${userId}`, config);

        // When getting messages, we assume they are read, so clear unread count locally
        thunkAPI.dispatch(setUnreadCount({ senderId: userId, count: 0 }));

        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const getUnreadCounts = createAsyncThunk('messages/getUnread', async (_, thunkAPI) => {
    try {
        const user = thunkAPI.getState().auth.user;
        const token = user?.token;
        if (!token) return thunkAPI.rejectWithValue('Not authorized, no token in state');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get(`${API_URL}/unread/counts`, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const sendMessage = createAsyncThunk('messages/send', async (messageData, thunkAPI) => {
    try {
        const user = thunkAPI.getState().auth.user;
        const token = user?.token;
        if (!token) return thunkAPI.rejectWithValue('Not authorized, no token in state');

        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.post(API_URL, messageData, config);
        return response.data;
    } catch (error) {
        return thunkAPI.rejectWithValue(error.response?.data?.message || error.message);
    }
});

export const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        reset: (state) => {
            state.messages = [];
        },
        addMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        setUnreadCount: (state, action) => {
            const { senderId, count, lastMessageTime } = action.payload;
            if (!state.unreadCounts[senderId]) {
                state.unreadCounts[senderId] = { count: 0 };
            }
            state.unreadCounts[senderId].count = count;
            if (lastMessageTime) {
                state.unreadCounts[senderId].lastMessageTime = lastMessageTime;
            }
        },
        markMessagesAsRead: (state, action) => {
            const { readerId, readAt } = action.payload;
            state.messages = state.messages.map(msg => {
                // If I am the sender and the reader is the receiver
                if (String(msg.receiver) === String(readerId) && !msg.isRead) {
                    return { ...msg, isRead: true, readAt };
                }
                return msg;
            });
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getMessages.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getMessages.fulfilled, (state, action) => {
                state.isLoading = false;
                state.messages = action.payload;
            })
            .addCase(getMessages.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getUnreadCounts.fulfilled, (state, action) => {
                state.unreadCounts = action.payload;
            })
            .addCase(sendMessage.fulfilled, (state, action) => {
                // Avoid duplicate if addMessage already added it via socket
                const exists = state.messages.some(m => m._id === action.payload._id);
                if (!exists) {
                    state.messages.push(action.payload);
                }
                const receiverId = action.payload.receiver?._id || action.payload.receiver;
                if (!state.unreadCounts[receiverId]) state.unreadCounts[receiverId] = {};
                state.unreadCounts[receiverId].lastMessageTime = action.payload.createdAt;
            });
    },
});

export const { reset, addMessage, setUnreadCount, markMessagesAsRead } = messageSlice.actions;
export default messageSlice.reducer;

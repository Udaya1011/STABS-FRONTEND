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
            const msg = action.payload;
            // Prevent duplicate messages (can arrive via socket AND sendMessage.fulfilled)
            if (msg._id && state.messages.some(m => String(m._id) === String(msg._id))) return;
            state.messages.push(msg);
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
            const readerStr = String(readerId || '');
            state.messages = state.messages.map(msg => {
                // Normalize receiver: could be plain string OR ObjectId object
                const msgReceiver = String(msg.receiver?._id || msg.receiver || '');
                if (msgReceiver === readerStr && !msg.isRead) {
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
                const msg = action.payload;
                const exists = state.messages.some(m => String(m._id) === String(msg._id));
                if (!exists) {
                    // Tag explicitly so isMe check is bulletproof regardless of ObjectId format
                    state.messages.push({ ...msg, _isMine: true });
                }
                const receiverId = msg.receiver?._id || msg.receiver;
                if (receiverId) {
                    if (!state.unreadCounts[receiverId]) state.unreadCounts[receiverId] = {};
                    state.unreadCounts[receiverId].lastMessageTime = msg.createdAt;
                }
            });
    },
});

export const { reset, addMessage, setUnreadCount, markMessagesAsRead } = messageSlice.actions;
export default messageSlice.reducer;

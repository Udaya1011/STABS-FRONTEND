import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Subjects from './pages/Subjects';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Appointments from './pages/Appointments';
import Chat from './pages/Chat';
import Videos from './pages/Videos';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import SocketListener from './components/common/SocketListener';
import WebRTCCall from './components/common/WebRTCCall';

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <Router>
      <div className="min-h-screen bg-secondary-50">
        <SocketListener />
        <WebRTCCall />
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="departments" element={<Departments />} />
            <Route path="subjects" element={<Subjects />} />
            <Route path="teachers" element={<Teachers />} />
            <Route path="students" element={<Students />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="chat" element={<Chat />} />
            <Route path="chat/:userId" element={<Chat />} />
            <Route path="videos" element={<Videos />} />
            <Route path="profile" element={<Profile />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;

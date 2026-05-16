import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RoomsPage from './pages/RoomsPage';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import MyBookingsPage from './pages/MyBookingsPage';
import ProfilePage from './pages/ProfilePage';
import CalendarPage from './pages/CalendarPage';
import { RoomProvider } from './context/RoomContext';

function App() {
  return (
    <RoomProvider>
      <BrowserRouter>
        <Routes>

          {/* Public route */}
          <Route path="/" element={<LoginPage />} />

          {/* User only routes */}
          <Route
            path="/rooms"
            element={
              <ProtectedRoute userOnly={true}>
                <Layout><RoomsPage /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/mybookings"
            element={
              <ProtectedRoute userOnly={true}>
                <Layout><MyBookingsPage /></Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/book/:id"
            element={
              <ProtectedRoute userOnly={true}>
                <Layout><BookingPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Profile — accessible by both user and admin */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout><ProfilePage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Calendar */}
          <Route
            path="/calendar"
            element={
              <ProtectedRoute>
                <Layout><CalendarPage /></Layout>
              </ProtectedRoute>
            }
          />

          {/* Admin only route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </RoomProvider>
  );
}

export default App;
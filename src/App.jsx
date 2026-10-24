import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import DashboardLayout from './components/dashboard/Layout';
import OrganizerDashboard from './pages/Organizer/Dashboard';
import Analyzer from './pages/Organizer/Analyzer';
import LeaderDashboard from './pages/Leader/Dashboard';
import MemberDashboard from './pages/Member/Dashboard';
import Quizzes from './pages/Member/Quizzes';
import Matching from './pages/Matching';
import Strength from './pages/Strength';
import Reviews from './pages/Reviews';
import Leaderboard from './pages/Leaderboard';
import AdminDashboard from './pages/Admin/Dashboard';
import PersonalDetails from './pages/Profile/PersonalDetails';

function Protected({ children, roles }){
  const { user, isAuthenticated } = useAuth();
  if(!isAuthenticated) return <Navigate to="/login" replace />;
  if(roles && !roles.includes(user?.role)) return <Navigate to={`/dashboard/${user?.role}`} replace />;
  return children;
}

function RoleRedirect(){
  const { user } = useAuth();
  if(!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/dashboard/${user.role}`} replace />;
}

export default function App(){
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing/>} />
            <Route path="/login" element={<Login/>} />
            <Route path="/register" element={<Register/>} />

            <Route path="/dashboard" element={<Protected><DashboardLayout/></Protected>}>
              <Route index element={<RoleRedirect/>} />
              <Route path="profile" element={<Protected><PersonalDetails/></Protected>} />
              {/* Organizer */}
              <Route path="organizer" element={<Protected roles={['organizer','admin']}><OrganizerDashboard/></Protected>} />
              <Route path="organizer/problems" element={<Protected roles={['organizer','admin']}><OrganizerDashboard/></Protected>} />
              <Route path="organizer/analyzer" element={<Protected roles={['organizer','admin']}><Analyzer/></Protected>} />
              {/* Leader */}
              <Route path="leader" element={<Protected roles={['leader','admin']}><LeaderDashboard/></Protected>} />
              <Route path="leader/create" element={<Protected roles={['leader','admin']}><LeaderDashboard/></Protected>} />
              {/* Member */}
              <Route path="member" element={<Protected roles={['member','admin']}><MemberDashboard/></Protected>} />
              <Route path="member/profile" element={<Protected roles={['member','admin']}><MemberDashboard/></Protected>} />
              <Route path="member/quizzes" element={<Protected roles={['member','leader','admin']}><Quizzes/></Protected>} />
              {/* Shared */}
              <Route path="teams" element={<Protected><LeaderDashboard/></Protected>} />
              <Route path="matching" element={<Protected><Matching/></Protected>} />
              <Route path="strength" element={<Protected><Strength/></Protected>} />
              <Route path="reviews" element={<Protected><Reviews/></Protected>} />
              <Route path="leaderboard" element={<Protected><Leaderboard/></Protected>} />
              {/* Admin */}
              <Route path="admin" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
              <Route path="admin/users" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
              <Route path="admin/problems" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
              <Route path="admin/quizzes" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
              <Route path="admin/certificates" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './components/dashboard/Layout';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Auth/Login'));
const Register = lazy(() => import('./pages/Auth/Register'));
const OrganizerDashboard = lazy(() => import('./pages/Organizer/Dashboard'));
const Analyzer = lazy(() => import('./pages/Organizer/Analyzer'));
const LeaderDashboard = lazy(() => import('./pages/Leader/Dashboard'));
const MemberDashboard = lazy(() => import('./pages/Member/Dashboard'));
const Quizzes = lazy(() => import('./pages/Member/Quizzes'));
const AssessmentCenter = lazy(() => import('./pages/Member/AssessmentCenter'));
const Matching = lazy(() => import('./pages/Matching'));
const Strength = lazy(() => import('./pages/Strength'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminUserDetails = lazy(() => import('./pages/Admin/UserDetails'));
const PersonalDetails = lazy(() => import('./pages/Profile/PersonalDetails'));
const TeamWorkspace = lazy(() => import('./pages/Workspace/TeamWorkspace'));
const FindTeams = lazy(() => import('./pages/Member/FindTeams'));

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 rounded-full border-3 border-[var(--border)] border-t-[var(--accent)] animate-spin" />
      <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Loading TeamMatch...</span>
    </div>
  );
}

function TeamsRouter() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <Navigate to="/dashboard/admin/teams" replace />;
  }
  if (user?.role === 'organizer') {
    return <Navigate to="/dashboard/organizer/teams" replace />;
  }
  if (user?.role === 'member') {
    return <FindTeams />;
  }
  return <LeaderDashboard />;
}

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Landing/>} />
              <Route path="/login" element={<Login/>} />
              <Route path="/register" element={<Register/>} />

              <Route path="/dashboard" element={<Protected><DashboardLayout/></Protected>}>
                <Route index element={<RoleRedirect/>} />
                <Route path="profile" element={<Protected><PersonalDetails/></Protected>} />
                {/* Organizer */}
                <Route path="organizer" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/competitions" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/create-competition" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/problems" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/analyzer" element={<Protected roles={['organizer']}><Analyzer/></Protected>} />
                <Route path="organizer/teams" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/submissions" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/judging" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                <Route path="organizer/results" element={<Protected roles={['organizer']}><OrganizerDashboard/></Protected>} />
                {/* Leader */}
                <Route path="leader" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/create" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/teams" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/invitations" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/requests" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/workspace" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/tasks" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                <Route path="leader/submissions" element={<Protected roles={['leader']}><LeaderDashboard/></Protected>} />
                {/* Member */}
                <Route path="member" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/my-teams" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/invitations" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/requests" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/workspace" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/tasks" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/profile" element={<Protected roles={['member']}><MemberDashboard/></Protected>} />
                <Route path="member/quizzes" element={<Protected roles={['member','leader']}><AssessmentCenter/></Protected>} />
                <Route path="member/assessments" element={<Protected roles={['member','leader']}><AssessmentCenter/></Protected>} />
                <Route path="member/teams" element={<Protected roles={['member']}><FindTeams/></Protected>} />
                {/* Shared */}
                <Route path="assessments" element={<Protected roles={['member','leader']}><AssessmentCenter/></Protected>} />
                <Route path="teams" element={<Protected><TeamsRouter/></Protected>} />
                <Route path="teams/:teamId/workspace" element={<Protected><TeamWorkspace/></Protected>} />
                <Route path="workspace/:teamId" element={<Protected><TeamWorkspace/></Protected>} />
                <Route path="matching" element={<Protected roles={['leader']}><Matching/></Protected>} />
                <Route path="strength" element={<Protected roles={['leader','admin','organizer']}><Strength/></Protected>} />
                <Route path="reviews" element={<Protected><Reviews/></Protected>} />
                <Route path="leaderboard" element={<Protected><Leaderboard/></Protected>} />
                {/* Admin */}
                <Route path="admin" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/submissions" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/users" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/users/:userId" element={<Protected roles={['admin']}><AdminUserDetails/></Protected>} />
                <Route path="admin/organizers" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/teams" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/competitions" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/problems" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/quizzes" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/certificates" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
                <Route path="admin/settings" element={<Protected roles={['admin']}><AdminDashboard/></Protected>} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

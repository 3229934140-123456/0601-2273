import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Schedule from "@/pages/Schedule";
import Reservation from "@/pages/Reservation";
import Equipment from "@/pages/Equipment";
import Report from "@/pages/Report";
import Grade from "@/pages/Grade";
import Chemical from "@/pages/Chemical";
import DataCenter from "@/pages/DataCenter";
import Profile from "@/pages/Profile";

function RootRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === "student") {
    return <Navigate to="/reservation" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RootRedirect />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin", "leader"]}>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin", "leader"]}>
              <Layout>
                <Schedule />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservation"
          element={
            <ProtectedRoute allowedRoles={["student", "teacher", "admin", "leader"]}>
              <Layout>
                <Reservation />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin", "leader"]}>
              <Layout>
                <Equipment />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/report"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin", "leader"]}>
              <Layout>
                <Report />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/grade"
          element={
            <ProtectedRoute allowedRoles={["student", "teacher", "admin", "leader"]}>
              <Layout>
                <Grade />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chemical"
          element={
            <ProtectedRoute allowedRoles={["teacher", "admin", "leader"]}>
              <Layout>
                <Chemical />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/data"
          element={
            <ProtectedRoute allowedRoles={["admin", "leader"]}>
              <Layout>
                <DataCenter />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["student", "teacher", "admin", "leader"]}>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-4 glow-text">404</h1>
                <p className="text-dark-500 mb-8">页面不存在</p>
                <a href="/" className="btn-primary">
                  返回首页
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

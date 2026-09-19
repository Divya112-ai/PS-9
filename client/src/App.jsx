import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CitizenReport from './pages/CitizenReport';
import IncidentDetails from './pages/IncidentDetails';
import Resources from './pages/Resources';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Responder from './pages/Responder';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/report" element={<CitizenReport />} />

      {/* Protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/incidents/:id"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin', 'responder']}>
            <Layout>
              <IncidentDetails />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <Layout>
              <Resources />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/alerts"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <Layout>
              <Alerts />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/responder"
        element={
          <ProtectedRoute allowedRoles={['responder']}>
            <Layout>
              <Responder />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
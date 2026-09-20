import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import CommandCenterLayout from './components/layout/CommandCenterLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CitizenReport from './pages/CitizenReport';
import IncidentDetails from './pages/IncidentDetails';
import Incidents from './pages/Incidents';
import Resources from './pages/Resources';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Responder from './pages/Responder';
import MyReports from './pages/MyReports';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/report" element={<CitizenReport />} />

      {/* Citizen dashboard */}
      <Route
        path="/my-reports"
        element={
          <ProtectedRoute allowedRoles={['citizen']}>
            <MyReports />
          </ProtectedRoute>
        }
      />

      {/* Operator/Admin — wrapped with CommandCenterLayout (new sidebar) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <CommandCenterLayout>
              <Dashboard />
            </CommandCenterLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <CommandCenterLayout>
              <Incidents />
            </CommandCenterLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/incidents/:id"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin', 'responder']}>
            <CommandCenterLayout>
              <IncidentDetails />
            </CommandCenterLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/resources"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <CommandCenterLayout>
              <Resources />
            </CommandCenterLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <CommandCenterLayout>
              <Alerts />
            </CommandCenterLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/analytics"
        element={
          <ProtectedRoute allowedRoles={['operator', 'admin']}>
            <CommandCenterLayout>
              <Analytics />
            </CommandCenterLayout>
          </ProtectedRoute>
        }
      />

      {/* Responder — keeps old Layout (mobile-friendly, no sidebar) */}
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
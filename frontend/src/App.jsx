import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetManagement from './pages/AssetManagement';
import PublicAssetView from './pages/PublicAssetView';
import AssetRegister from './pages/AssetRegister';
import InspectionForm from './pages/InspectionForm';
import UserManagement from './pages/UserManagement';
import CompanyProfile from './pages/CompanyProfile';
import ScanQR from './pages/ScanQR';

import ErrorBoundary from './components/ErrorBoundary';

import ResetPassword from './pages/ResetPassword';

const ComplianceReports = React.lazy(() => import('./pages/ComplianceReports.jsx'));

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets/:type" element={<AssetManagement />} />
        <Route path="/assets/:type/register" element={<AssetRegister />} />
        <Route path="/assets/:type/edit/:serial" element={<AssetRegister />} />
        <Route path="/inspection/:id" element={<InspectionForm />} />
        <Route path="/v/:serial" element={<PublicAssetView />} />
        <Route path="/scan" element={<ScanQR />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/company" element={<CompanyProfile />} />
        <Route path="/compliance" element={
          <React.Suspense fallback={<div className="p-4 text-white">Loading...</div>}>
            <ComplianceReports />
          </React.Suspense>
        } />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

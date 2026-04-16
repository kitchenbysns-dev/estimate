/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import NewEstimation from './pages/NewEstimation';
import Templates from './pages/Templates';
import Settings from './pages/Settings';
import MaterialCalculation from './pages/MaterialCalculation';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects/:id" element={<ProjectDetails />} />
          <Route path="projects/:id/new-estimation" element={<NewEstimation />} />
          <Route path="projects/:id/material-calculation" element={<MaterialCalculation />} />
          <Route path="templates" element={<Templates />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

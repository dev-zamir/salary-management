import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import EmployeesPage from "./pages/EmployeesPage";
import InsightsPage from "./pages/InsightsPage";

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="*" element={<Navigate to="/employees" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

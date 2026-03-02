import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Services from "./pages/Services";
import NewEntry from "./pages/NewEntry";
import Entries from "./pages/Entries";
import Deliveries from "./pages/Deliveries";
import Reports from "./pages/Reports";
import Admin from "./pages/Admin";
import Labour from "./pages/Labour";

function PrivateRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" />;
/*************  ✨ Windsurf Command ⭐  *************/
/**
 * The main App component. It renders a BrowserRouter
 * component with Routes component as its child. The Routes
 * component has two Route components as its children. The
 * first Route component is for the login path and renders
 * the Login component. The second Route component is for
 * any other path and renders a PrivateRoute component.
 * The PrivateRoute component checks if the user is logged
 * in (i.e., if there is a token in the local storage). If
 * the user is logged in, it renders the Layout component with
 * Routes component as its child. The Routes component has
 * five Route components as its children for rendering different
 * pages of the application. If the user is not logged in, it
 * redirects the user to the login page.
 */
/*******  ffad9c2b-fc3b-402e-bd7a-5e59fc5b26f8  *******/}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/new-entry" element={<NewEntry />} />
                  <Route path="/entries" element={<Entries />} />
                  <Route path="/deliveries" element={<Deliveries />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/labour" element={<Labour />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
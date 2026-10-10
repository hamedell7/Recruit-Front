import { useEffect, useState } from "react";
import { api } from "../services/api";
import LoadingScreen from "../components/common/LoadingScreen";
import Toast from "../components/common/Toast";
import Login from "../features/auth/Login";
import Header from "../components/layout/Header";
import Dashboard from "../features/dashboard/Dashboard";
import StaffDashboard from "../features/dashboard/StaffDashboard";
import RequestWizard from "../features/requests/RequestWizard";

const STAFF_ROLES = ["OFFICER", "REVIEWER", "SUPERVISOR", "ADMIN"];

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState("dashboard");
  const [activeRequest, setActiveRequest] = useState(null);
  const [toast, setToast] = useState(null);

  const restoreRoute = async (currentUser) => {
    const match = window.location.pathname.match(/^\/requests\/([^/]+)\/?$/);
    if (match && !STAFF_ROLES.includes(currentUser?.role)) {
      try {
        const request = await api.request(decodeURIComponent(match[1]));
        setActiveRequest(request);
        setView("wizard");
        return;
      } catch {
        // Fall back to the dashboard if a deep-linked request no longer exists
        // or the current user is not allowed to open it.
      }
    }

    setActiveRequest(null);
    setView("dashboard");
    if (window.location.pathname !== "/dashboard") {
      window.history.replaceState({ view: "dashboard" }, "", "/dashboard");
    }
  };

  const navigateToDashboard = (replace = false) => {
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({ view: "dashboard" }, "", "/dashboard");
    setActiveRequest(null);
    setView("dashboard");
  };

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const me = await api.me();
        if (cancelled) return;
        setUser(me);
        await restoreRoute(me);
      } catch {
        // Login screen is displayed when there is no valid session.
      } finally {
        if (!cancelled) setBooting(false);
      }
    };
    bootstrap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const onPopState = async () => {
      const match = window.location.pathname.match(/^\/requests\/([^/]+)\/?$/);
      if (match && !STAFF_ROLES.includes(user.role)) {
        try {
          const request = await api.request(decodeURIComponent(match[1]));
          if (cancelled) return;
          setActiveRequest(request);
          setView("wizard");
          return;
        } catch {
          // Continue to the dashboard if the request is unavailable.
        }
      }
      if (cancelled) return;
      setActiveRequest(null);
      setView("dashboard");
      if (window.location.pathname !== "/dashboard") {
        window.history.replaceState({ view: "dashboard" }, "", "/dashboard");
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      cancelled = true;
      window.removeEventListener("popstate", onPopState);
    };
  }, [user]);

  if (booting) return <LoadingScreen />;

  const openRequest = (request) => {
    window.history.pushState({ view: "wizard", requestId: request.id }, "", "/requests/" + encodeURIComponent(request.id));
    setActiveRequest(request);
    setView("wizard");
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {}
    setUser(null);
    setActiveRequest(null);
    setView("dashboard");
    window.history.replaceState({}, "", "/");
  };

  return (
    <div className="app-shell">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {!user ? (
        <Login
          onLogin={(me) => {
            setUser(me);
            navigateToDashboard(true);
            setToast(null);
          }}
        />
      ) : (
        <>
          <Header user={user} onLogout={logout} />
          {view === "dashboard" ? (
            STAFF_ROLES.includes(user.role) ? (
              <StaffDashboard />
            ) : (
              <Dashboard
                user={user}
                onOpenRequest={openRequest}
                onCreated={openRequest}
                onError={setToast}
              />
            )
          ) : activeRequest ? (
            <RequestWizard
              user={user}
              request={activeRequest}
              onBack={() => navigateToDashboard(true)}
              onError={setToast}
            />
          ) : (
            <LoadingScreen />
          )}
        </>
      )}
    </div>
  );
}

export default App;

import { useEffect, useState } from "react";
import { api } from "../services/api";
import LoadingScreen from "../components/common/LoadingScreen";
import Toast from "../components/common/Toast";
import Login from "../features/auth/Login";
import Header from "../components/layout/Header";
import Dashboard from "../features/dashboard/Dashboard";
import RequestWizard from "../features/requests/RequestWizard";

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState("dashboard");
  const [activeRequest, setActiveRequest] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api.me()
      .then((me) => {
        setUser(me);
        setView("dashboard");
      })
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  if (booting) return <LoadingScreen />;

  const openRequest = (request) => {
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
  };

  return (
    <div className="app-shell">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {!user ? (
        <Login
          onLogin={(me) => {
            setUser(me);
            setView("dashboard");
            setToast(null);
          }}
        />
      ) : (
        <>
          <Header user={user} onLogout={logout} />
          {view === "dashboard" ? (
            <Dashboard
              user={user}
              onOpenRequest={openRequest}
              onCreated={openRequest}
              onError={setToast}
            />
          ) : (
            <RequestWizard
              user={user}
              request={activeRequest}
              onBack={() => setView("dashboard")}
              onError={setToast}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;

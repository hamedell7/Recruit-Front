import { lazy, Suspense, useEffect, useState } from "react";
import { api } from "../services/api";
import LoadingScreen from "../components/common/LoadingScreen";
import Toast from "../components/common/Toast";
import Login from "../features/auth/Login";
import Header from "../components/layout/Header";
const Dashboard = lazy(() => import("../features/dashboard/Dashboard"));
const StaffDashboard = lazy(() => import("../features/dashboard/StaffDashboard"));
const RequestWizard = lazy(() => import("../features/requests/RequestWizard"));
const StaffRequestDetails = lazy(() => import("../features/dashboard/StaffRequestDetails"));

const STAFF_ROLES = ["OFFICER", "REVIEWER", "SUPERVISOR", "ADMIN"];

function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [staffPath, setStaffPath] = useState(() => window.location.pathname);
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeStaffRequestId, setActiveStaffRequestId] = useState(null);
  const [toast, setToast] = useState(null);

  const restoreRoute = async (currentUser) => {
    const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
    const staffDetailMatch = pathname.match(/^\/staff\/requests\/([^/]+)$/);
    const staffRouteMatch = ["/staff/requests", "/staff/workflows", "/staff/request-settings", "/staff/users"].includes(pathname);
    if (STAFF_ROLES.includes(currentUser?.role)) {
      if (staffDetailMatch && currentUser?.role === "ADMIN") {
        setStaffPath("/staff/requests");
        setActiveRequest(null);
        setActiveStaffRequestId(decodeURIComponent(staffDetailMatch[1]));
        setView("staff-request-details");
        return;
      }
      const adminOnlyRoute = pathname === "/staff/workflows" || pathname === "/staff/request-settings" || pathname === "/staff/users";
      const requestedPath = staffRouteMatch ? pathname : "/staff/requests";
      const canonicalPath = adminOnlyRoute && currentUser?.role !== "ADMIN" ? "/staff/requests" : requestedPath;
      if (canonicalPath !== pathname) {
        window.history.replaceState({ view: "dashboard", workspace: canonicalPath }, "", canonicalPath);
      }
      setStaffPath(canonicalPath);
      setActiveRequest(null);
      setActiveStaffRequestId(null);
      setView("dashboard");
      return;
    }

    const match = window.location.pathname.match(/^\/requests\/([^/]+)\/?$/);
    if (match && !STAFF_ROLES.includes(currentUser?.role)) {
      try {
        const request = await api.request(decodeURIComponent(match[1]));
        setSidebarOpen(true);
        setActiveRequest(request);
        setView("wizard");
        return;
      } catch {
        // Fall back to the dashboard if a deep-linked request no longer exists
        // or the current user is not allowed to open it.
      }
    }

    setActiveRequest(null);
    setStaffPath("/dashboard");
    setView("dashboard");
    if (window.location.pathname !== "/dashboard") {
      window.history.replaceState({ view: "dashboard" }, "", "/dashboard");
    }
  };

  const navigateToDashboard = (replace = false, targetUser = user) => {
    const isStaff = STAFF_ROLES.includes(targetUser?.role);
    const path = isStaff ? "/staff/requests" : "/dashboard";
    const method = replace ? "replaceState" : "pushState";
    setSidebarOpen(true);
    window.history[method]({ view: "dashboard", workspace: path }, "", path);
    setStaffPath(path);
    setActiveRequest(null);
    setView("dashboard");
  };

  const navigateStaffWorkspace = (path) => {
    const allowedPaths = ["/staff/requests"];
    if (user?.role === "ADMIN") allowedPaths.push("/staff/workflows", "/staff/request-settings", "/staff/users");
    if (!allowedPaths.includes(path)) return;
    if (window.location.pathname !== path) {
      window.history.pushState({ view: "dashboard", workspace: path }, "", path);
    }
    setStaffPath(path);
    setActiveRequest(null);
    setActiveStaffRequestId(null);
    setView("dashboard");
  };

  const navigateToUserRequests = (targetUser) => {
    if (user?.role !== "ADMIN") return;

    const searchTerm = String(targetUser?.national_id || targetUser?.mobile || "").trim();
    if (!searchTerm) {
      setToast({ type: "error", text: "برای این کاربر کد ملی یا شماره موبایل ثبت نشده است." });
      return;
    }

    const query = new URLSearchParams({ search: searchTerm }).toString();
    const path = "/staff/requests?" + query;
    window.history.pushState({ view: "dashboard", workspace: "/staff/requests", search: searchTerm }, "", path);
    setStaffPath("/staff/requests");
    setActiveRequest(null);
    setActiveStaffRequestId(null);
    setView("dashboard");
  };

  const backToStaffRequests = () => {
    navigateStaffWorkspace("/staff/requests");
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
    if (booting) {
      document.title = "سامانه جامع گزینش";
      return;
    }

    let pageTitle;
    if (!user) {
      pageTitle = "ورود به سامانه";
    } else if (view === "wizard") {
      pageTitle = activeRequest?.tracking_code
        ? "پرونده " + activeRequest.tracking_code
        : "تکمیل پرونده";
    } else if (view === "staff-request-details") {
      pageTitle = "جزئیات پرونده";
    } else if (STAFF_ROLES.includes(user.role)) {
      const workspaceTitles = {
        "/staff/requests": "مدیریت درخواست‌ها",
        "/staff/workflows": "مدیریت گردش‌کار",
        "/staff/request-settings": "تنظیمات درخواست‌ها",
        "/staff/users": "مدیریت کاربران",
      };
      pageTitle = workspaceTitles[staffPath] || "پنل مدیریت";
    } else {
      pageTitle = "پنل متقاضی";
    }

    document.title = pageTitle + " | سامانه جامع گزینش";
  }, [booting, user, view, staffPath, activeRequest]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const onPopState = async () => {
      const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
      const staffDetailMatch = pathname.match(/^\/staff\/requests\/([^/]+)$/);
      const staffRouteMatch = ["/staff/requests", "/staff/workflows", "/staff/request-settings", "/staff/users"].includes(pathname);
      if (STAFF_ROLES.includes(user.role)) {
        if (staffDetailMatch && user.role === "ADMIN") {
          setStaffPath("/staff/requests");
          setActiveRequest(null);
          setActiveStaffRequestId(decodeURIComponent(staffDetailMatch[1]));
          setView("staff-request-details");
          return;
        }
        const adminOnlyRoute = pathname === "/staff/workflows" || pathname === "/staff/request-settings" || pathname === "/staff/users";
        const requestedPath = staffRouteMatch ? pathname : "/staff/requests";
        const canonicalPath = adminOnlyRoute && user.role !== "ADMIN" ? "/staff/requests" : requestedPath;
        if (canonicalPath !== pathname) {
          window.history.replaceState({ view: "dashboard", workspace: canonicalPath }, "", canonicalPath);
        }
        setStaffPath(canonicalPath);
        setActiveRequest(null);
        setActiveStaffRequestId(null);
        setView("dashboard");
        return;
      }

      const match = window.location.pathname.match(/^\/requests\/([^/]+)\/?$/);
      if (match && !STAFF_ROLES.includes(user.role)) {
        try {
          const request = await api.request(decodeURIComponent(match[1]));
          if (cancelled) return;
          setSidebarOpen(true);
          setActiveRequest(request);
          setView("wizard");
          return;
        } catch {
          // Continue to the dashboard if the request is unavailable.
        }
      }
      if (cancelled) return;
      setActiveRequest(null);
      setActiveStaffRequestId(null);
      setStaffPath("/dashboard");
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
    setSidebarOpen(true);
    setActiveRequest(request);
    setView("wizard");
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      setToast({
        type: "error",
        text: error.message || "خروج از حساب انجام نشد؛ اتصال را بررسی کرده و دوباره تلاش کنید.",
        requestId: error.requestId,
      });
      return;
    }
    setUser(null);
    setSidebarOpen(true);
    setActiveRequest(null);
    setActiveStaffRequestId(null);
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
            navigateToDashboard(true, me);
            setToast(null);
          }}
        />
      ) : (
        <>
          <Header
            user={user}
            onLogout={logout}
            showSidebarToggle={view === "wizard" && user?.role === "ADMIN"}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen((open) => !open)}
            staffPath={staffPath}
            onNavigateStaff={navigateStaffWorkspace}
          />
          <Suspense fallback={<LoadingScreen />}>
          {view === "staff-request-details" && user?.role === "ADMIN" && activeStaffRequestId ? (
            <StaffRequestDetails
              key={activeStaffRequestId}
              requestId={activeStaffRequestId}
              onBack={backToStaffRequests}
              onError={setToast}
            />
          ) : view === "dashboard" ? (
            STAFF_ROLES.includes(user.role) ? (
              <StaffDashboard
                key={staffPath}
                user={user}
                onError={setToast}
                onViewUserRequests={navigateToUserRequests}
              />
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
              sidebarOpen={sidebarOpen}
              onBack={() => navigateToDashboard(true)}
              onError={setToast}
            />
          ) : (
            <LoadingScreen />
          )}
          </Suspense>
        </>
      )}
    </div>
  );
}

export default App;

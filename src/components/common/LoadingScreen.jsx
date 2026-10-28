function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img className="brand-mark large" src="/brand-logo.png" alt="" aria-hidden="true" />
      <div className="loading-spinner" />
      <strong>در حال آماده‌سازی سامانه</strong>
    </div>
  );
}

export default LoadingScreen;

import brandLogo from "../../assets/brand-logo.png";

function LoadingScreen() {
  return (
    <div className="loading-screen">
      <img className="brand-mark large" src={brandLogo} alt="" aria-hidden="true" />
      <div className="loading-spinner" />
      <strong>در حال آماده‌سازی سامانه</strong>
    </div>
  );
}

export default LoadingScreen;

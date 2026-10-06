function EmptyState({ onCreate }) {
  return (
    <div className="empty-card">
      <div className="empty-art"><span>R</span></div>
      <h3>هنوز درخواستی ثبت نکرده‌اید</h3>
      <p>اولین پرونده را بسازید تا مسیر مرحله‌ای برای شما فعال شود.</p>
      <button className="primary-button" onClick={onCreate}>شروع اولین درخواست</button>
    </div>
  );
}\n\nexport default EmptyState;\n
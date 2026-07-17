import { Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ onMenuClick, title }) => {
  const { business } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={22} />
        </button>
        <h1 className="topbar-title">{title || 'Dashboard'}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-badge">
          <span
            className={`status-dot ${
              business?.subscriptionStatus === 'active'
                ? 'status-active'
                : 'status-trial'
            }`}
          />
          <span className="topbar-status">
            {business?.subscriptionStatus?.toUpperCase() || 'TRIAL'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

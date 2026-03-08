import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MdNotifications, MdAdminPanelSettings } from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';
import { getReviewStats } from '../../services/reviewService';

const routeTitles = {
  '/': 'Dashboard',
  '/teachers': 'Teachers',
  '/students': 'Students',
  '/classes': 'Classes',
  '/attendance': 'Attendance Reports',
  '/reviews': 'Disciplinary Reviews',
};

function Navbar() {
  const { user } = useAuth();
  const location = useLocation();
  const [openReviews, setOpenReviews] = useState(0);

  // Get page title
  const getTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/students/')) return 'Student Profile';
    if (path.startsWith('/classes/')) return 'Class Detail';
    return routeTitles[path] || 'Admin Dashboard';
  };

  // Fetch open review count for notification badge
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getReviewStats();
        setOpenReviews(stats.open_count || 0);
      } catch {
        // silently fail
      }
    };
    fetchStats();
    // Poll every 5 minutes
    const interval = setInterval(fetchStats, 300000);
    return () => clearInterval(interval);
  }, []);

  const getInitials = (name) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="navbar">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button className="btn-icon relative">
            <MdNotifications className="w-5 h-5" />
            {openReviews > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {openReviews > 9 ? '9+' : openReviews}
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-200" />

        {/* Admin info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-xs">
            {getInitials(user?.full_name || user?.name)}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-700 leading-tight">
              {user?.full_name || user?.name || 'Admin'}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <MdAdminPanelSettings className="w-3 h-3" />
              Administrator
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdClass,
  MdAssignment,
  MdGavel,
  MdLogout,
} from 'react-icons/md';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/', label: 'Dashboard', icon: MdDashboard, end: true },
  { to: '/teachers', label: 'Teachers', icon: MdPeople },
  { to: '/students', label: 'Students', icon: MdSchool },
  { to: '/classes', label: 'Classes', icon: MdClass },
  { to: '/attendance', label: 'Attendance Reports', icon: MdAssignment },
  { to: '/reviews', label: 'Disciplinary Reviews', icon: MdGavel },
];

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside className="sidebar">
      {/* Logo / School Name */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <MdSchool className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-tight">
            School Admin
          </h1>
          <p className="text-indigo-300 text-xs">Attendance System</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <p className="text-indigo-400 text-xs font-semibold uppercase tracking-widest px-3 mb-2">
          Main Menu
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="sidebar-link-icon" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User info & Logout */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {getInitials(user?.full_name || user?.name)}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.full_name || user?.name || 'Admin'}
            </p>
            <p className="text-indigo-300 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-indigo-200 hover:bg-red-700/50 hover:text-white transition-colors text-sm font-medium"
        >
          <MdLogout className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;

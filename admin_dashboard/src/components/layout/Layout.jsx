import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout() {
  return (
    <div className="flex w-full min-h-screen bg-gray-50">
      <Sidebar />
      <div className="main-layout">
        <Navbar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;

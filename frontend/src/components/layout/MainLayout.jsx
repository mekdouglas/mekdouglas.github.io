import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const MainLayout = () => {
  return (
    <div>
      <Header />
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;

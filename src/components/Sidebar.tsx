import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  TrendingUp, 
  BarChart3, 
  Zap, 
  Settings, 
  HelpCircle
} from 'lucide-react';
import { ROUTES } from '../constants/routes';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const sidebarLinks = [
    { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: ROUTES.DASHBOARD },
    { title: 'Portfolio', icon: <PieChart size={20} />, path: ROUTES.PORTFOLIO },
    { title: 'Risk', icon: <TrendingUp size={20} />, path: ROUTES.RISK },
    { title: 'Performance', icon: <BarChart3 size={20} />, path: ROUTES.PERFORMANCE },
    { title: 'Optimization', icon: <Zap size={20} />, path: ROUTES.OPTIMIZATION },
  ];

  const overlayClasses = `fixed inset-0 bg-black bg-opacity-50 z-30 transition-opacity duration-300 lg:hidden ${
    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
  }`;

  const sidebarClasses = `fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-lg z-40 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:h-screen ${
    isOpen ? 'translate-x-0' : '-translate-x-full'
  }`;

  return (
    <>
      <div className={overlayClasses} onClick={onClose}></div>
      
      <aside className={sidebarClasses}>
        <div className="py-6 px-4 flex flex-col h-full">
          <div className="flex items-center justify-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary-600 flex items-center justify-center">
              <BarChart3 className="text-white" size={24} />
            </div>
            <h2 className="ml-2 text-xl font-bold text-gray-800 dark:text-gray-100">RiskPortfolio</h2>
          </div>
          
          <nav className="flex-1">
            <ul className="space-y-1">
              {sidebarLinks.map((link) => (
                <li key={link.path}>
                  <NavLink 
                    to={link.path}
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                  >
                    {link.icon}
                    <span>{link.title}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <ul className="space-y-1">
              <li>
                <a href="#" className="nav-link">
                  <Settings size={20} />
                  <span>Settings</span>
                </a>
              </li>
              <li>
                <a href="#" className="nav-link">
                  <HelpCircle size={20} />
                  <span>Help & Support</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
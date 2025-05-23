import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  activeClassName: string;
  defaultClassName: string;
}

interface ProfileItemProps {
  icon: 'user' | 'settings' | 'logout';
  text: string;
  id: string;
  onClick?: () => void;
}

interface MobileNavLinkProps {
  to: string;
  children: React.ReactNode;
  navigate: (to: string) => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, activeClassName, defaultClassName }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
        isActive ? activeClassName : defaultClassName
      }`}
    >
      {children}
    </a>
  );
};

const ProfileItem: React.FC<ProfileItemProps> = ({ icon, text, id, onClick = () => {} }) => {
  const icons = {
    user: (
      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    ),
    settings: (
      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clipRule="evenodd"
        />
      </svg>
    ),
    logout: (
      <svg className="mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
          clipRule="evenodd"
        />
      </svg>
    ),
  };

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 flex items-center transition-colors duration-150"
      role="menuitem"
      tabIndex={-1}
      id={id}
    >
      {icons[icon]}
      {text}
    </a>
  );
};

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, children, navigate }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
      className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
        isActive
          ? 'bg-primary-50 border-primary-500 text-primary-700'
          : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 hover:text-neutral-800'
      } transition-colors duration-200`}
    >
      {children}
    </a>
  );
};

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-sm">
      {/* Desktop navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side items */}
          <div className="flex items-center">
            <NavLink
              to="/"
              activeClassName="border-primary-500 text-neutral-900"
              defaultClassName="border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300"
            >
              Home
            </NavLink>
          </div>

          {/* Mobile menu button */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-neutral-400 hover:text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            <MobileNavLink to="/" navigate={navigate}>
              Home
            </MobileNavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
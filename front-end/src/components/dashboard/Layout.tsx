import { ReactNode, useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../common/Logo';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRestoreRef = useRef(0);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/workouts', label: 'Workouts', icon: '💪' },
    { path: '/exercises', label: 'Exercises', icon: '🏋️' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close without navigating — restore previous scroll position
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Close via navigation — scroll to top of new page
  const handleNavClose = () => {
    scrollRestoreRef.current = 0;
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on route change
  useEffect(() => {
    handleNavClose();
  }, [location.pathname]);

  // Lock body scroll & block backdrop touch when mobile menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const scrollY = window.scrollY;
    scrollRestoreRef.current = scrollY;
    const html = document.documentElement;
    html.style.overflow = 'hidden';
    html.style.position = 'fixed';
    html.style.top = `-${scrollY}px`;
    html.style.left = '0';
    html.style.right = '0';
    html.style.width = '100%';

    const backdrop = backdropRef.current;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.target === backdrop) e.preventDefault();
    };
    backdrop?.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      backdrop?.removeEventListener('touchmove', handleTouchMove);
      html.style.overflow = '';
      html.style.position = '';
      html.style.top = '';
      html.style.left = '';
      html.style.right = '';
      html.style.width = '';
      window.scrollTo(0, scrollRestoreRef.current);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-kin-beige">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-kin-stone-200 shadow-kin-soft sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/dashboard">
                <Logo />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-kin-sm font-semibold font-montserrat text-sm transition ${
                    isActive(item.path)
                      ? 'bg-kin-coral text-white shadow-kin-soft'
                      : 'text-kin-navy hover:bg-kin-stone-100'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Desktop User Menu */}
            <div className="hidden md:flex items-center relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-3 hover:bg-kin-stone-50 rounded-kin-sm p-2 transition"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kin-coral to-kin-teal flex items-center justify-center">
                  <span className="text-white font-bold font-montserrat">
                    {user?.displayName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-kin-navy font-semibold font-inter">
                  {user?.displayName}
                </span>
                <svg
                  className={`w-4 h-4 text-kin-navy transition-transform ${
                    showDropdown ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 top-14 w-48 bg-white rounded-kin-sm shadow-kin-strong border border-kin-stone-200 py-2 z-20">
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-kin-navy hover:bg-kin-stone-50 font-inter transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-kin-navy hover:bg-kin-stone-50 font-inter transition"
                      onClick={() => setShowDropdown(false)}
                    >
                      Settings
                    </Link>
                    <hr className="my-2 border-kin-stone-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-kin-coral hover:bg-kin-coral-50 font-inter transition"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-kin-navy"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          ref={backdropRef}
          className="md:hidden fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm overscroll-none"
          onClick={(e) => { if (e.target === e.currentTarget) closeMobileMenu(); }}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div className="bg-white shadow-kin-strong border-b border-kin-stone-200 px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-4 py-3 rounded-kin-sm font-semibold font-montserrat text-sm transition ${
                  isActive(item.path)
                    ? 'bg-kin-coral text-white shadow-kin-soft'
                    : 'text-kin-navy hover:bg-kin-stone-50'
                }`}
                onClick={handleNavClose}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
            <hr className="border-kin-stone-200" />
            <Link
              to="/profile"
              className="block px-4 py-3 rounded-kin-sm text-kin-navy hover:bg-kin-stone-50 font-inter transition"
              onClick={handleNavClose}
            >
              Profile
            </Link>
            <Link
              to="/settings"
              className="block px-4 py-3 rounded-kin-sm text-kin-navy hover:bg-kin-stone-50 font-inter transition"
              onClick={handleNavClose}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-3 rounded-kin-sm text-kin-coral hover:bg-kin-coral-50 font-inter transition"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;


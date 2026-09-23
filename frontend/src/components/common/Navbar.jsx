import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Pill, Menu, X, Heart, Package, Building2, ChevronDown, LogIn, Stethoscope } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onOpenGuest }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (e, targetHash) => {
    e.preventDefault();
    setMobileOpen(false);

    if (location.pathname === '/') {
      if (!targetHash) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const id = targetHash.replace('#', '');
        const elem = document.getElementById(id);
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate('/' + (targetHash || ''));
    }
  };

  const handleDonateClick = () => {
    if (onOpenGuest) onOpenGuest('DONOR');
    setMobileOpen(false);
  };

  const handleFindClick = () => {
    if (onOpenGuest) onOpenGuest('RECIPIENT');
    setMobileOpen(false);
  };

  // Close "More" dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAuthPage = ['/login', '/staff-login', '/register', '/pharmacy-register', '/doctor-register', '/forgot-password', '/reset-password'].some(
    path => location.pathname.startsWith(path)
  );

  return (
    <nav className="sticky top-0 z-50 w-full bg-surface border-b border-theme shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-600/30">
                <Pill className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-primary">MediCycle</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-muted hover:text-blue-500 font-medium transition-colors"
            >
              Home
            </Link>
            {!isAuthPage && (
              <>
                <a
                  href="/#about"
                  onClick={(e) => handleNavClick(e, '#about')}
                  className="text-muted hover:text-blue-500 font-medium transition-colors"
                >
                  About
                </a>
                <a
                  href="/#how-it-works"
                  onClick={(e) => handleNavClick(e, '#how-it-works')}
                  className="text-muted hover:text-blue-500 font-medium transition-colors"
                >
                  How It Works
                </a>
              </>
            )}
          </div>

          {/* Desktop Right Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {onOpenGuest && (
              <>
                {/* "More" dropdown for secondary actions */}
                <div className="relative" ref={moreRef}>
                  <button
                    onClick={() => setMoreOpen(!moreOpen)}
                    className="flex items-center gap-1 text-muted hover:text-blue-500 font-medium px-3 py-2 rounded-lg hover:bg-surface2 transition-colors text-sm"
                  >
                    More <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {moreOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-surface border border-theme rounded-xl shadow-lg py-1 z-50">
                      <Link
                        to="/login"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-muted hover:text-blue-500 hover:bg-surface2 transition-colors"
                      >
                        <LogIn className="h-4 w-4" />
                        Staff Login
                      </Link>
                      <Link
                        to="/pharmacy-register"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-500 hover:text-emerald-400 hover:bg-surface2 transition-colors"
                      >
                        <Building2 className="h-4 w-4" />
                        Pharmacy Registration
                      </Link>
                      <Link
                        to="/doctor-register"
                        onClick={() => setMoreOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-indigo-400 hover:text-indigo-300 hover:bg-surface2 transition-colors"
                      >
                        <Stethoscope className="h-4 w-4" />
                        Doctor Registration
                      </Link>
                    </div>
                  )}
                </div>
                <div className="w-px h-6 bg-theme" />
                <button
                  onClick={handleFindClick}
                  className="flex items-center gap-1.5 text-blue-500 hover:text-blue-400 border border-blue-500/40 hover:border-blue-400 font-medium px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  <Package className="h-4 w-4" />
                  Find Medicines
                </button>
                <button
                  onClick={handleDonateClick}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/30 flex items-center gap-1.5 text-sm"
                >
                  <Heart className="h-4 w-4" />
                  Donate
                </button>
              </>
            )}
            {!onOpenGuest && (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/30">
                Admin / Pharmacist Login
              </Link>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-lg text-muted hover:bg-surface2"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-surface border-t border-theme px-4 py-4 flex flex-col gap-3">
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="text-primary font-medium py-2"
          >
            Home
          </Link>
          {!isAuthPage && (
            <>
              <a
                href="/#about"
                onClick={(e) => handleNavClick(e, '#about')}
                className="text-primary font-medium py-2"
              >
                About
              </a>
              <a
                href="/#how-it-works"
                onClick={(e) => handleNavClick(e, '#how-it-works')}
                className="text-primary font-medium py-2"
              >
                How It Works
              </a>
            </>
          )}
          <hr className="border-theme" />
          {onOpenGuest ? (
            <>
              <button onClick={handleDonateClick} className="bg-blue-600 text-white text-center rounded-lg py-2.5 font-medium hover:bg-blue-500 flex items-center justify-center gap-2">
                <Heart className="h-4 w-4" /> Donate Medicine
              </button>
              <button onClick={handleFindClick} className="text-blue-500 border border-blue-500/40 text-center rounded-lg py-2.5 font-medium hover:bg-surface2 flex items-center justify-center gap-2">
                <Package className="h-4 w-4" /> Find Medicines
              </button>
              <hr className="border-theme" />
              <Link to="/login" className="text-muted font-medium py-2 flex items-center gap-2">
                <LogIn className="h-4 w-4" /> Staff Login
              </Link>
              <Link to="/pharmacy-register" onClick={() => setMobileOpen(false)} className="text-emerald-500 font-medium py-2 flex items-center gap-2">
                <Building2 className="h-4 w-4" /> Pharmacy Registration
              </Link>
              <Link to="/doctor-register" onClick={() => setMobileOpen(false)} className="text-indigo-400 font-medium py-2 flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Doctor Registration
              </Link>
            </>
          ) : (
            <Link to="/login" className="bg-blue-600 text-white text-center rounded-lg py-2.5 font-medium hover:bg-blue-500">
              Admin / Pharmacist Login
            </Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;

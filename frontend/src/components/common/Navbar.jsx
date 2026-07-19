import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Menu, X, Heart, Package } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ onOpenGuest }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDonateClick = () => {
    if (onOpenGuest) onOpenGuest('DONOR');
    setMobileOpen(false);
  };

  const handleFindClick = () => {
    if (onOpenGuest) onOpenGuest('RECIPIENT');
    setMobileOpen(false);
  };

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
            <a href="#" className="text-muted hover:text-blue-500 font-medium transition-colors">Home</a>
            <a href="#about" className="text-muted hover:text-blue-500 font-medium transition-colors">About</a>
            <a href="#how-it-works" className="text-muted hover:text-blue-500 font-medium transition-colors">How It Works</a>
          </div>

          {/* Desktop Right Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            {onOpenGuest && (
              <>
                <Link
                  to="/login"
                  className="text-muted hover:text-blue-500 font-medium px-3 py-2 transition-colors"
                >
                  Staff Login
                </Link>
                <div className="w-px h-6 bg-theme" />
                <button
                  onClick={handleDonateClick}
                  className="flex items-center gap-1.5 text-blue-500 hover:text-blue-400 font-medium px-4 py-2 transition-colors"
                >
                  <Heart className="h-4 w-4" />
                  Donate
                </button>
                <button
                  onClick={handleFindClick}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <Package className="h-4 w-4" />
                  Find Medicines
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
          <a href="#" className="text-primary font-medium py-2">Home</a>
          <a href="#about" className="text-primary font-medium py-2">About</a>
          <a href="#how-it-works" className="text-primary font-medium py-2">How It Works</a>
          <hr className="border-theme" />
          {onOpenGuest ? (
            <>
              <Link to="/login" className="text-muted font-medium py-2">Staff Login</Link>
              <button onClick={handleDonateClick} className="text-blue-500 font-medium py-2 text-left flex items-center gap-2">
                <Heart className="h-4 w-4" /> Donate Medicine
              </button>
              <button onClick={handleFindClick} className="bg-blue-600 text-white text-center rounded-lg py-2.5 font-medium hover:bg-blue-500 flex items-center justify-center gap-2">
                <Package className="h-4 w-4" /> Find Medicines
              </button>
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

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pill, Menu, X } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
            <Link to="/login" className="text-muted hover:text-blue-500 font-medium transition-colors">Medicines</Link>
          </div>

          {/* Desktop Right Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />
            <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium px-4 py-2 transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/30"
            >
              Sign up
            </Link>
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
          <Link to="/login" className="text-blue-500 font-medium py-2">Log in</Link>
          <Link to="/register" className="bg-blue-600 text-white text-center rounded-lg py-2.5 font-medium hover:bg-blue-500">Sign up</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

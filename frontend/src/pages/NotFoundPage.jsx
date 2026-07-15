import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { FileQuestion } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-page">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-surface p-10 rounded-3xl shadow-xl max-w-lg w-full border border-theme">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-500/10 mb-8 border border-blue-500/20">
            <FileQuestion className="h-12 w-12 text-blue-500" />
          </div>
          <h1 className="text-7xl font-black text-primary mb-4">404</h1>
          <h2 className="text-2xl font-bold text-primary mb-3">Page Not Found</h2>
          <p className="text-muted mb-8 leading-relaxed">
            Oops! The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/20 hover:shadow-lg w-full sm:w-auto"
          >
            Go back home
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFoundPage;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCount, setIsOpen } = useCart();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2">
            <i className="fas fa-store text-2xl text-purple-600"></i>
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              SHREYANSH ONLINE STORE
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-sm text-gray-700 hidden sm:block font-medium">
                  <i className="fas fa-user-circle mr-1 text-purple-500"></i>
                  {user.name}
                </span>
                
                {/* ADMIN PANEL LINK - ALREADY HERE ✓ */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-purple-600 hidden sm:block font-medium">
                    <i className="fas fa-cog mr-1"></i>
                    Admin
                  </Link>
                )}
                
                {/* ADD THIS FOR MOBILE VIEW - Admin Link visible on small screens */}
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-gray-700 hover:text-purple-600 sm:hidden font-medium">
                    <i className="fas fa-cog text-xl"></i>
                  </Link>
                )}
                
                <button 
                  onClick={() => setIsOpen(true)} 
                  className="relative p-2 hover:bg-purple-50 rounded-full transition-colors"
                >
                  <i className="fas fa-shopping-cart text-xl text-gray-700"></i>
                  {getCount() > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {getCount()}
                    </span>
                  )}
                </button>
                
                <Link to="/orders" className="p-2 hover:bg-purple-50 rounded-full transition-colors">
                  <i className="fas fa-box text-xl text-gray-700"></i>
                </Link>
                
                <button 
                  onClick={logout} 
                  className="p-2 hover:bg-red-50 rounded-full transition-colors"
                >
                  <i className="fas fa-sign-out-alt text-xl text-gray-700"></i>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-purple-600 px-4 py-2 font-medium">
                  <i className="fas fa-sign-in-alt mr-1"></i>
                  Login
                </Link>
                <Link to="/register" className="gradient-bg text-white px-6 py-2 rounded-full font-medium hover:opacity-90 transition-opacity shadow-md">
                  <i className="fas fa-user-plus mr-1"></i>
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
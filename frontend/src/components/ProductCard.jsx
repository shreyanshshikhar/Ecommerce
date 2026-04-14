import React from 'react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(product);
    toast.success(`Added ${product.name} to cart!`);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden card-hover">
      <div className="relative">
        <img
          src={product.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
          alt={product.name}
          className="w-full h-56 object-cover"
        />
        {product.stock < 5 && product.stock > 0 && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Only {product.stock} left!
          </span>
        )}
      </div>
      
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
          <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-semibold">
            {product.category}
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-purple-600">₹{product.price}</span>
          <div className="flex items-center">
            <i className="fas fa-star text-yellow-400 text-sm mr-1"></i>
            <span className="text-sm text-gray-600">4.5</span>
          </div>
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className={`w-full py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${
            product.stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'gradient-bg text-white hover:shadow-lg'
          }`}
        >
          <i className={`fas ${product.stock === 0 ? 'fa-times-circle' : 'fa-cart-plus'} mr-2`}></i>
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
import React, { memo } from 'react';
import ProductCard from './ProductCard';

function ProductGridComponent({ products = [], isLoading = false, onAddToCart }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl p-4 border border-gray-100 shadow-xs animate-pulse flex flex-col h-80"
          >
            <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-3 w-20 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-4"></div>
            <div className="mt-auto flex justify-between items-center">
              <div className="h-5 w-16 bg-gray-200 rounded"></div>
              <div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-xs">
        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-400">
          🌱
        </div>
        <h3 className="text-lg font-bold text-gray-800">No Products Found</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
          We couldn't find any products matching your search criteria. Try adjusting your filters or search keyword.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}

export default memo(ProductGridComponent);

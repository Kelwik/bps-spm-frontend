import { ChevronLeft, ChevronRight } from 'lucide-react';

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page
  }

  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={16} className="mr-2" />
        Previous
      </button>

      <span className="text-sm text-gray-700">
        Page <span className="font-medium">{currentPage}</span> of{' '}
        <span className="font-medium">{totalPages}</span>
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
        <ChevronRight size={16} className="ml-2" />
      </button>
    </div>
  );
}

export default Pagination;

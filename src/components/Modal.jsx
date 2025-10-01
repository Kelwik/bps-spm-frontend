import { X, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

function Modal({ isOpen, onClose, title, children, footer }) {
  const [show, setShow] = useState(isOpen);

  // Control mounting/unmounting for animation
  useEffect(() => {
    if (isOpen) {
      setShow(true);
    } else {
      // Wait for fade-out animation before unmounting
      const timer = setTimeout(() => setShow(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show) return null;

  return (
    // Backdrop
    <div
      className={`fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-sm
      transition-opacity duration-300 ease-in-out
      ${isOpen ? 'opacity-100 bg-black/50' : 'opacity-0 bg-black/0'}`}
      onClick={onClose}
    >
      {/* Konten Modal */}
      <div
        className={`bg-white rounded-lg shadow-xl w-full max-w-md transform transition-all duration-300 ease-in-out
        ${isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat klik dalam
      >
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <AlertTriangle className="text-red-500" size={20} />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6">{children}</div>

        {/* Footer Modal */}
        {footer && (
          <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;

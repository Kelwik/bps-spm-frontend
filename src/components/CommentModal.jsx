import { useState } from 'react';
import { X, MessageSquareWarning } from 'lucide-react';

function CommentModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [comment, setComment] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = () => {
    onSubmit(comment);
    setComment(''); // Reset for next time
  };

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal Content */}
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <MessageSquareWarning className="text-red-500" size={20} />
            Alasan Penolakan SPM
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <label htmlFor="rejectionComment" className="form-label mb-2">
            Tolong berikan alasan mengapa SPM ini ditolak (opsional).
          </label>
          <textarea
            id="rejectionComment"
            rows="4"
            className="form-input"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Contoh: Terdapat kesalahan pada rincian belanja perjalanan dinas..."
          ></textarea>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <button onClick={onClose} className="btn-secondary">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            className="btn-danger"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Memproses...' : 'Tolak & Kirim Komentar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CommentModal;

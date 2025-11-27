// src/pages/SpmCreatePage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import apiClient from '../api';
import RincianGroup from '../components/RincianGroup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatusBadge from '../components/StatusBadge';
import CommentModal from '../components/CommentModal';
import Modal from '../components/Modal';
import {
  Plus,
  Building,
  MessageSquareWarning,
  Link as LinkIcon,
  CheckCircle,
} from 'lucide-react';

const formatCurrency = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

const getDefaultTanggal = (year) => {
  if (!year) return '';
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function SpmCreatePage({ isEditMode = false }) {
  const { id: spmId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran: selectedYear } = useSatker();

  // --- 1. CHECK IF USER IS VIEWER ---
  const isViewer = user?.role === 'viewer';

  const [spmData, setSpmData] = useState({
    nomorSpm: '',
    tanggal: getDefaultTanggal(selectedYear),
    tahunAnggaran: selectedYear,
    driveLink: '',
  });

  const [rincianGroups, setRincianGroups] = useState([]);
  const [error, setError] = useState(null);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);

  const handleSpmDataChange = (e) => {
    const { name, value } = e.target;
    setSpmData((prev) => ({ ...prev, [name]: value }));
  };

  const totalAnggaran = rincianGroups
    .flatMap((g) => g.items)
    .reduce((sum, item) => sum + (Number(item.jumlah) || 0), 0);

  const { data: existingSpmData, isLoading: isLoadingSpm } = useQuery({
    queryKey: ['spm', spmId],
    queryFn: async () => apiClient.get(`/spm/${spmId}`).then((res) => res.data),
    enabled: isEditMode && !!spmId,
  });

  const { data: satkerList, isLoading: isLoadingSatkers } = useQuery({
    queryKey: ['satkers'],
    queryFn: async () => apiClient.get('/satker').then((res) => res.data),
  });

  const satkerIdForSpm = isEditMode
    ? existingSpmData?.satkerId
    : selectedSatkerId;
  const satkerName = isLoadingSatkers
    ? 'Memuat...'
    : satkerList?.find((s) => s.id === satkerIdForSpm)?.nama ||
      'Tidak Diketahui';

  useEffect(() => {
    if (isEditMode && existingSpmData) {
      setSpmData({
        nomorSpm: existingSpmData.nomorSpm,
        tanggal: new Date(existingSpmData.tanggal).toISOString().split('T')[0],
        tahunAnggaran: existingSpmData.tahunAnggaran,
        driveLink: existingSpmData.driveLink || '',
      });
      const grouped = existingSpmData.rincian.reduce((acc, rincian) => {
        const groupKey = `${rincian.kodeProgram}-${rincian.kodeKegiatan}-${rincian.kodeAkunId}`;
        if (!acc[groupKey]) {
          acc[groupKey] = {
            id: crypto.randomUUID(),
            kodeProgram: rincian.kodeProgram,
            kodeKegiatan: rincian.kodeKegiatan,
            kodeAkunId: rincian.kodeAkunId,
            items: [],
          };
        }
        acc[groupKey].items.push({ ...rincian });
        return acc;
      }, {});
      setRincianGroups(Object.values(grouped));
    }
  }, [isEditMode, existingSpmData]);

  const { mutate: saveSpm, isPending: isSaving } = useMutation({
    mutationFn: (payload) =>
      isEditMode
        ? apiClient.put(`/spm/${spmId}`, payload)
        : apiClient.post('/spm', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['allRincian'] });
      navigate('/spm');
    },
    onError: (err) =>
      setError(
        err.response?.data?.error ||
          `Terjadi kesalahan saat ${
            isEditMode ? 'memperbarui' : 'menyimpan'
          } SPM.`
      ),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, comment }) =>
      apiClient.patch(`/spm/${spmId}/status`, { status, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spms'] });
      queryClient.invalidateQueries({ queryKey: ['spm', spmId] });
      setIsCommentModalOpen(false);
      setIsAcceptModalOpen(false);
      navigate('/spm');
    },
    onError: (err) =>
      setError(err.response?.data?.error || 'Gagal memperbarui status SPM.'),
  });

  const handleStatusUpdate = (newStatus) => {
    if (newStatus === 'DITOLAK') {
      setIsCommentModalOpen(true);
    } else if (newStatus === 'DITERIMA') {
      setIsAcceptModalOpen(true);
    }
  };

  const handleRejectSubmit = (comment) => {
    updateStatusMutation.mutate({ status: 'DITOLAK', comment });
  };

  const handleConfirmAccept = () => {
    updateStatusMutation.mutate({ status: 'DITERIMA' });
  };

  const handleAddGroup = () =>
    setRincianGroups([
      ...rincianGroups,
      {
        id: crypto.randomUUID(),
        kodeProgram: '',
        kodeKegiatan: '',
        kodeAkunId: null,
        items: [
          {
            id: crypto.randomUUID(),
            jumlah: 0,
            jawabanFlags: [],
            kodeKRO: '',
            kodeRO: '',
            kodeKomponen: '',
            kodeSubkomponen: '',
            uraian: '',
          },
        ],
      },
    ]);
  const handleRemoveGroup = (groupId) =>
    setRincianGroups(rincianGroups.filter((g) => g.id !== groupId));
  const handleUpdateGroup = (groupId, updatedData) =>
    setRincianGroups(
      rincianGroups.map((group) =>
        group.id === groupId ? { ...group, ...updatedData } : group
      )
    );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);
    const targetSatkerId =
      user.role === 'op_satker' ? user.satkerId : selectedSatkerId;
    if (!targetSatkerId && !isEditMode) {
      setError(
        'Untuk admin provinsi, silakan pilih Satker terlebih dahulu di dashboard.'
      );
      return;
    }
    // ... rincianForApi logic ...
    const rincianForApi = rincianGroups.flatMap((group) =>
      group.items.map((item) => ({
        id: isEditMode && item.spmId ? item.id : undefined,
        kodeProgram: group.kodeProgram,
        kodeKegiatan: group.kodeKegiatan,
        kodeAkunId: group.kodeAkunId,
        jumlah: item.jumlah,
        jawabanFlags: item.jawabanFlags,
        kodeKRO: item.kodeKRO,
        kodeRO: item.kodeRO,
        kodeKomponen: item.kodeKomponen,
        kodeSubkomponen: item.kodeSubkomponen,
        uraian: item.uraian,
      }))
    );
    const finalPayload = {
      ...spmData,
      tahunAnggaran: parseInt(spmData.tahunAnggaran),
      satkerId: isEditMode ? existingSpmData.satkerId : targetSatkerId,
      rincian: rincianForApi,
    };
    saveSpm(finalPayload);
  };

  // --- 2. DISABLE FORM IF USER IS VIEWER ---
  // If user is viewer, the form is ALWAYS disabled.
  const isFormDisabled =
    isViewer || (isEditMode && existingSpmData?.status === 'DITERIMA');

  // --- 3. HIDE BUTTONS FOR VIEWERS ---
  const showValidationButtons =
    !isViewer && // Hide if viewer
    isEditMode &&
    ['op_prov', 'supervisor'].includes(user.role) &&
    existingSpmData?.status === 'MENUNGGU';

  const showSaveButtons = !isFormDisabled && !isViewer;

  if (isEditMode && isLoadingSpm) {
    return <div className="p-6 text-center">Memuat data SPM...</div>;
  }

  return (
    <>
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-800">
              {isEditMode
                ? isViewer
                  ? 'Detail SPM'
                  : 'Detail / Edit SPM'
                : 'Buat SPM Baru'}
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <Building size={16} />
              <span className="font-semibold">{satkerName}</span>
            </p>
          </div>
          {isEditMode && existingSpmData && (
            <StatusBadge status={existingSpmData.status} />
          )}
        </div>

        {existingSpmData?.status === 'DITOLAK' &&
          existingSpmData.rejectionComment && (
            <div className="bg-red-50 p-4 mb-6 rounded-md border border-red-200">
              <div className="flex items-start gap-3">
                <MessageSquareWarning className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">
                    SPM Ditolak dengan Komentar:
                  </h3>
                  <p className="text-red-700 mt-1 italic">
                    "{existingSpmData.rejectionComment}"
                  </p>
                </div>
              </div>
            </div>
          )}

        {/* Show message for Viewers */}
        {isViewer && (
          <div className="bg-blue-50 p-4 mb-6 rounded-md border border-blue-200 text-blue-800">
            Anda sedang dalam <strong>Mode Lihat (Read-Only)</strong>. Anda
            tidak dapat mengubah data SPM.
          </div>
        )}

        {isFormDisabled && !isViewer && (
          <div className="bg-blue-100 p-4 mb-6 rounded-md">
            SPM ini sudah <strong>Diterima</strong> dan tidak dapat diubah lagi.
          </div>
        )}
        {error && <div className="bg-red-100 p-4 mb-6 rounded-md">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset disabled={isFormDisabled}>
            {/* ... (Informasi Utama fields remain the same) ... */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                Informasi Utama
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                <div>
                  <label className="form-label">Nomor SPM</label>
                  <input
                    type="text"
                    name="nomorSpm"
                    value={spmData.nomorSpm}
                    onChange={handleSpmDataChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tanggal</label>
                  <input
                    type="date"
                    name="tanggal"
                    value={spmData.tanggal}
                    onChange={handleSpmDataChange}
                    className="form-input"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Tahun Anggaran</label>
                  <input
                    type="number"
                    name="tahunAnggaran"
                    value={spmData.tahunAnggaran}
                    disabled
                    className="form-input-disabled"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="form-label flex items-center gap-2">
                    <LinkIcon size={14} /> Tautan Google Drive
                  </label>
                  <input
                    type="url"
                    name="driveLink"
                    placeholder="https://drive.google.com/..."
                    value={spmData.driveLink}
                    onChange={handleSpmDataChange}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Total Anggaran</label>
                  <input
                    type="text"
                    value={formatCurrency(totalAnggaran)}
                    disabled
                    className="form-input-disabled font-mono text-lg"
                  />
                </div>
              </div>
            </div>

            {/* ... (Daftar Rincian section) ... */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-700 border-b pb-2">
                Daftar Rincian
              </h2>
              <div className="space-y-6">
                {rincianGroups.map((group, index) => (
                  <RincianGroup
                    key={group.id}
                    groupData={group}
                    onUpdate={handleUpdateGroup}
                    onRemove={() => handleRemoveGroup(group.id)}
                    isFirst={index === 0}
                  />
                ))}
              </div>
              {!isViewer && (
                <button
                  type="button"
                  onClick={handleAddGroup}
                  className="btn-primary"
                >
                  <Plus size={16} /> Tambah Kelompok Rincian
                </button>
              )}
            </div>
          </fieldset>

          {/* Form Actions / Buttons */}
          <div className="pt-6 border-t flex flex-wrap justify-end gap-4">
            {showValidationButtons && (
              <>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('DITOLAK')}
                  disabled={updateStatusMutation.isPending}
                  className="btn-danger"
                >
                  Tolak & Kembalikan
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusUpdate('DITERIMA')}
                  disabled={updateStatusMutation.isPending}
                  className="btn-success"
                >
                  Terima & Finalisasi
                </button>
              </>
            )}

            {/* Always show "Kembali" button, but hide "Simpan" for viewers */}
            <button
              type="button"
              onClick={() => navigate('/spm')}
              className="btn-secondary"
              disabled={isSaving || updateStatusMutation.isPending}
            >
              {isViewer ? 'Kembali' : 'Batal'}
            </button>

            {showSaveButtons && (
              <button
                type="submit"
                className="btn-primary"
                disabled={isSaving || updateStatusMutation.isPending}
              >
                {isSaving
                  ? isEditMode
                    ? 'Memperbarui...'
                    : 'Menyimpan...'
                  : isEditMode
                  ? 'Update SPM'
                  : 'Simpan SPM'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modals (only needed if buttons are shown, but safe to keep) */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={() => setIsCommentModalOpen(false)}
        onSubmit={handleRejectSubmit}
        isSubmitting={updateStatusMutation.isPending}
      />

      <Modal
        isOpen={isAcceptModalOpen}
        onClose={() => setIsAcceptModalOpen(false)}
        title={
          <span className="flex items-center gap-2 text-green-700">
            <CheckCircle size={20} /> Konfirmasi Penerimaan SPM
          </span>
        }
        footer={
          <>
            <button
              onClick={() => setIsAcceptModalOpen(false)}
              className="btn-secondary"
              disabled={updateStatusMutation.isPending}
            >
              Batal
            </button>
            <button
              onClick={handleConfirmAccept}
              className="btn-success"
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending
                ? 'Memproses...'
                : 'Ya, Terima SPM'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-700">
          Apakah Anda yakin ingin menerima dan memfinalisasi SPM dengan nomor:
          <br />
          <strong className="font-semibold text-gray-900 mt-2 block">
            {existingSpmData?.nomorSpm || spmData.nomorSpm}
          </strong>
          <br />
          Tindakan ini akan mengunci SPM dan tidak dapat diubah lagi.
        </p>
      </Modal>
    </>
  );
}

export default SpmCreatePage;

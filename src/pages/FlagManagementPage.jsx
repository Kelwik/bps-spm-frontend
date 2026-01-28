// src/pages/FlagManagementPage.jsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, FolderPlus } from 'lucide-react';

// --- DAFTAR DOKUMEN STANDAR (Sesuai Excel/CSV) ---
const STANDARD_DOCUMENTS = [
  'KAK',
  'FPA/Nota Dinas',
  'SP2D',
  'SPM',
  'SPBy',
  'DRPP',
  'SPK/Surat Perjanjian',
  'Kuitansi/Bukti Pembayaran',
  'Berita Acara Pembayaran',
  'Tanda Terima',
  'SSP',
  'SSP PPh Pasal 21',
  'SK KPA',
  'SK KPA tentang Honor',
  'SK PPK',
  'SK Pejabat Pengadaan',
  'SK Pemilihan Pokja',
  'Undangan',
  'Daftar Hadir',
  'Notulen',
  'Jadwal Kegiatan',
  'Dokumentasi',
  'CV Narsum',
  'Bahan Paparan',
  'Surat Tugas',
  'SPD dan Bukti Visum',
  'Presensi dan Uang Makan',
  'Rincian Biaya Perjadin',
  'Bukti Transportasi',
  'Bukti Penginapan',
  'Laporan Inda/mengajar',
  'Laporan Kegiatan/ Perjadin',
  'Rekapitulasi (Pembayaran) Perjadin',
  'Surat Pernyataan tidak menggunakan kendaraan dinas',
  'Daftar Pengeluaran Riil',
  'Surat Pernyataan fasilitas kantor tidak mencukupi',
  'Invoice',
  'List Kamar Hotel',
  'Formulir Identifikasi Kebutuhan',
  'Formulir Perencanaan Pengadaan',
  'Rencana Umum Pengadaan (RUP)',
  'Penetapan Spesifikasi Teknis',
  'Penetapan RAB/HPS',
  'Penetapan Rancangan Kontrak',
  'Permintaan pemilihan kepada pejabar Pengadaan',
  'Permintaan Pokja Pemilihan Kepada Ka UKPBJ',
  'Surat Penugasan Pokja Pemilihan',
  'Bukti Pemesanan/Surat Undangan Penyampaian Penawaran',
  'BA negosiasi teknis dan/atau harga dan/atau Klarifikasi',
  'Berita Acara/ Laporan Hasil Pemilihan',
  'Kontrak Kerjasama dengan Pihak Hotel',
  'Surat Perintah Mulai Kerja (SPMK)',
  'Berita Acara Pemeriksaan Pekerjaan (BAPP)',
  'Berita Acara serah terima hasil pekerjaan (BAST)',
  'FC NPWP',
  'Bukti Prestasi Kerja',
  'Memo PPK',
  'ID SiRUP',
  'Daftar Rekapitulasi Belanja Honor',
  'SPJ',
].sort(); // Diurutkan abjad agar mudah dicari

// Form untuk Menambah Kode Akun Baru
function KodeAkunForm({ onSuccess, onCancel }) {
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSuccess({ kode, nama });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="form-label">Kode Akun (6 Digit)</label>
        <input
          type="text"
          className="form-input"
          value={kode}
          onChange={(e) => setKode(e.target.value)}
          placeholder="Contoh: 521211"
          maxLength={6}
          required
        />
      </div>
      <div>
        <label className="form-label">Uraian Akun</label>
        <input
          type="text"
          className="form-input"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Contoh: Belanja Bahan"
          required
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary">
          Simpan Akun
        </button>
      </div>
    </form>
  );
}

// Form untuk Menambah/Edit Flag (Updated with Dropdown)
function FlagForm({ flag, kodeAkunId, onSuccess, onCancel }) {
  // Jika sedang edit, gunakan nama yang sudah ada.
  // Jika nama existing tidak ada di list standar, otomatis masuk mode manual.
  const isStandard = !flag?.nama || STANDARD_DOCUMENTS.includes(flag.nama);

  const [inputMode, setInputMode] = useState(isStandard ? 'select' : 'manual');
  const [selectedDoc, setSelectedDoc] = useState(
    isStandard ? flag?.nama || '' : '',
  );
  const [manualName, setManualName] = useState(
    !isStandard ? flag?.nama || '' : '',
  );

  const [tipe, setTipe] = useState(flag?.tipe || 'IYA');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Tentukan nama final berdasarkan mode input
    const finalName = inputMode === 'select' ? selectedDoc : manualName;

    if (!finalName) {
      alert('Mohon pilih atau isi nama dokumen.');
      return;
    }

    const payload = { nama: finalName, tipe, kodeAkunId };
    onSuccess(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Pilihan Mode Input */}
      <div>
        <label className="form-label">Nama Dokumen / Persyaratan</label>

        {inputMode === 'select' ? (
          <select
            className="form-input mb-2"
            value={selectedDoc}
            onChange={(e) => {
              if (e.target.value === 'MANUAL_INPUT') {
                setInputMode('manual');
                setManualName('');
              } else {
                setSelectedDoc(e.target.value);
              }
            }}
            required
          >
            <option value="">-- Pilih Dokumen Standar --</option>
            {STANDARD_DOCUMENTS.map((doc, idx) => (
              <option key={idx} value={doc}>
                {doc}
              </option>
            ))}
            <option disabled>-------------------</option>
            <option
              value="MANUAL_INPUT"
              className="text-blue-600 font-semibold"
            >
              + Lainnya (Input Manual)
            </option>
          </select>
        ) : (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="form-input flex-1"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Ketik nama dokumen baru..."
              required
              autoFocus
            />
            <button
              type="button"
              className="btn-secondary text-xs px-2"
              onClick={() => {
                setInputMode('select');
                setSelectedDoc('');
              }}
            >
              Kembali ke List
            </button>
          </div>
        )}
      </div>

      <div>
        <label className="form-label">Tipe Persyaratan</label>
        <select
          className="form-input"
          value={tipe}
          onChange={(e) => setTipe(e.target.value)}
        >
          <option value="IYA">Wajib Ada (Iya)</option>
          <option value="IYA_TIDAK">Opsional (Iya/Tidak)</option>
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Batal
        </button>
        <button type="submit" className="btn-primary">
          Simpan
        </button>
      </div>
    </form>
  );
}

function FlagManagementPage() {
  const queryClient = useQueryClient();
  const [selectedKodeAkunId, setSelectedKodeAkunId] = useState('');

  const [flagModalState, setFlagModalState] = useState({
    isOpen: false,
    flag: null,
  });
  const [akunModalOpen, setAkunModalOpen] = useState(false);

  // 1. Fetch Kode Akun List
  const { data: kodeAkunList, isLoading: isLoadingKodeAkun } = useQuery({
    queryKey: ['kodeAkun'],
    queryFn: async () => apiClient.get('/kode-akun').then((res) => res.data),
  });

  // 2. Fetch Flags
  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', selectedKodeAkunId],
    queryFn: async () =>
      apiClient
        .get(`/kode-akun/${selectedKodeAkunId}/flags`)
        .then((res) => res.data),
    enabled: !!selectedKodeAkunId,
  });

  // 3. Mutation: Create Kode Akun
  const createAkunMutation = useMutation({
    mutationFn: (payload) => apiClient.post('/kode-akun', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['kodeAkun'] });
      setAkunModalOpen(false);
      if (res.data?.id) setSelectedKodeAkunId(res.data.id);
      alert('Kode Akun berhasil dibuat!');
    },
    onError: (err) => alert(err.response?.data?.error || 'Gagal membuat akun'),
  });

  // 4. Mutation: Save Flag
  const saveFlagMutation = useMutation({
    mutationFn: (payload) => {
      return flagModalState.flag?.id
        ? apiClient.put(`/flags/${flagModalState.flag.id}`, payload)
        : apiClient.post('/flags', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['flags', selectedKodeAkunId],
      });
      setFlagModalState({ isOpen: false, flag: null });
    },
    onError: (err) => alert(err.response?.data?.error || 'Terjadi kesalahan'),
  });

  // 5. Mutation: Delete Flag
  const deleteFlagMutation = useMutation({
    mutationFn: (flagId) => apiClient.delete(`/flags/${flagId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['flags', selectedKodeAkunId],
      });
    },
  });

  const handleDeleteFlag = (flag) => {
    if (window.confirm(`Hapus persyaratan "${flag.nama}"?`)) {
      deleteFlagMutation.mutate(flag.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Manajemen Checklist Dokumen
          </h1>
          <p className="text-gray-500 mt-1">
            Atur daftar persyaratan dokumen untuk setiap Kode Akun.
          </p>
        </div>
        <button
          onClick={() => setAkunModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <FolderPlus size={18} />
          Kode Akun Baru
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="max-w-md">
          <label className="form-label">Pilih Kode Akun untuk Dikelola</label>
          <select
            className="form-input"
            value={selectedKodeAkunId}
            onChange={(e) => setSelectedKodeAkunId(e.target.value)}
            disabled={isLoadingKodeAkun}
          >
            <option value="">-- Pilih Kode Akun --</option>
            {kodeAkunList?.map((akun) => (
              <option key={akun.id} value={akun.id}>
                {akun.kode} - {akun.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedKodeAkunId && (
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Daftar Persyaratan
            </h2>
            <button
              onClick={() => setFlagModalState({ isOpen: true, flag: null })}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} /> Tambah Persyaratan
            </button>
          </div>
          {isLoadingFlags && <p className="text-center py-4">Memuat data...</p>}
          {!isLoadingFlags && flags?.length === 0 && (
            <p className="text-gray-500 italic text-center py-4">
              Belum ada persyaratan dokumen untuk akun ini.
            </p>
          )}
          {!isLoadingFlags && (
            <ul className="divide-y divide-gray-200">
              {flags?.map((flag) => (
                <li
                  key={flag.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{flag.nama}</p>
                    <p className="text-sm text-gray-500">
                      Tipe: {flag.tipe === 'IYA_TIDAK' ? 'Opsional' : 'Wajib'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setFlagModalState({ isOpen: true, flag })}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteFlag(flag)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Modal Add/Edit Flag */}
      <Modal
        isOpen={flagModalState.isOpen}
        onClose={() => setFlagModalState({ isOpen: false, flag: null })}
        title={flagModalState.flag ? 'Edit Persyaratan' : 'Tambah Persyaratan'}
      >
        <FlagForm
          flag={flagModalState.flag}
          kodeAkunId={selectedKodeAkunId}
          onSuccess={(payload) => saveFlagMutation.mutate(payload)}
          onCancel={() => setFlagModalState({ isOpen: false, flag: null })}
        />
      </Modal>

      {/* Modal Add Kode Akun */}
      <Modal
        isOpen={akunModalOpen}
        onClose={() => setAkunModalOpen(false)}
        title="Tambah Kode Akun Baru"
      >
        <KodeAkunForm
          onSuccess={(payload) => createAkunMutation.mutate(payload)}
          onCancel={() => setAkunModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

export default FlagManagementPage;

import { useQuery } from '@tanstack/react-query';
import apiClient from '../api';
import {
  Trash2,
  MessageSquareText,
  Check,
  X,
  Minus,
  Clock,
  CheckCheck,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// --- SUB-COMPONENT: FlagButton ---
const FlagButton = ({
  label,
  isActive,
  onClick,
  colorClass,
  activeColorClass,
  icon: Icon,
  title,
}) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`
      flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border transition-all flex-1
      ${
        isActive
          ? `${activeColorClass} ring-1 ring-offset-1 ring-current shadow-sm z-10`
          : `${colorClass} hover:opacity-80`
      }
    `}
  >
    <Icon size={14} strokeWidth={2.5} />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

function RincianItem({ itemData, kodeAkunId, onUpdate, onRemove, isOnlyItem }) {
  const { user } = useAuth();

  const { data: flags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['flags', kodeAkunId],
    queryFn: async () => {
      if (!kodeAkunId) return [];
      const res = await apiClient.get(`/kode-akun/${kodeAkunId}/flags`);
      return res.data;
    },
    enabled: !!kodeAkunId,
  });

  const handleInputChange = (field, value) => onUpdate({ [field]: value });

  const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '';
    if (num === 0) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleJumlahChange = (inputValue) => {
    const cleanValue = inputValue.replace(/\./g, '').replace(/[^0-9]/g, '');
    const numberValue = parseInt(cleanValue, 10);
    onUpdate({ jumlah: isNaN(numberValue) ? 0 : numberValue });
  };

  const updateFlag = (flagName, flagType) => {
    const existingFlags = itemData.jawabanFlags || [];
    let updatedFlags;
    const existingFlagIndex = existingFlags.findIndex(
      (f) => f.nama === flagName
    );
    if (existingFlagIndex > -1) {
      updatedFlags = existingFlags.map((flag, index) =>
        index === existingFlagIndex ? { ...flag, tipe: flagType } : flag
      );
    } else {
      updatedFlags = [...existingFlags, { nama: flagName, tipe: flagType }];
    }
    onUpdate({ jawabanFlags: updatedFlags });
  };

  const getFlagValue = (flagName) =>
    itemData.jawabanFlags?.find((f) => f.nama === flagName)?.tipe || '';

  const setAllFlags = (status) => {
    if (!flags) return;
    const newFlags = flags.map((f) => ({
      nama: f.nama,
      tipe: status,
    }));
    onUpdate({ jawabanFlags: newFlags });
  };

  const resetAllFlags = () => {
    onUpdate({ jawabanFlags: [] });
  };

  const isSupervisor = user?.role === 'supervisor';
  const hasCatatan = itemData.catatan && itemData.catatan.trim() !== '';
  const showCatatan = isSupervisor || hasCatatan;

  return (
    <div className="p-5 bg-white rounded-lg border border-slate-200 shadow-sm relative space-y-5 transition-shadow hover:shadow-md">
      {!isOnlyItem && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-3 -right-3 text-slate-400 bg-white hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full shadow border border-slate-100 transition-colors"
          title="Hapus Rincian"
        >
          <Trash2 size={16} />
        </button>
      )}

      {/* --- Row 1: Amount & Codes --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* REVERTED: Standard styling for Amount */}
        <div className="lg:col-span-2">
          <label className="form-label-sm">Jumlah (Rp)</label>
          <input
            type="text"
            value={formatNumber(itemData.jumlah)}
            onChange={(e) => handleJumlahChange(e.target.value)}
            className="form-input font-mono text-right"
            placeholder="0"
            required
          />
        </div>
        <div>
          <label className="form-label-sm">KRO</label>
          <input
            type="text"
            value={itemData.kodeKRO || ''}
            onChange={(e) => handleInputChange('kodeKRO', e.target.value)}
            className="form-input text-center uppercase"
            placeholder="-"
          />
        </div>
        <div>
          <label className="form-label-sm">RO</label>
          <input
            type="text"
            value={itemData.kodeRO || ''}
            onChange={(e) => handleInputChange('kodeRO', e.target.value)}
            className="form-input text-center uppercase"
            placeholder="-"
          />
        </div>
        <div>
          <label className="form-label-sm">Komp</label>
          <input
            type="text"
            value={itemData.kodeKomponen || ''}
            onChange={(e) => handleInputChange('kodeKomponen', e.target.value)}
            className="form-input text-center uppercase"
            placeholder="-"
          />
        </div>
        <div>
          <label className="form-label-sm">Sub</label>
          <input
            type="text"
            value={itemData.kodeSubkomponen || ''}
            onChange={(e) =>
              handleInputChange('kodeSubkomponen', e.target.value)
            }
            className="form-input text-center uppercase"
            placeholder="-"
          />
        </div>
      </div>

      {/* --- Row 2: Uraian & Catatan --- */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          showCatatan ? 'lg:grid-cols-2' : ''
        }`}
      >
        <div>
          <label className="form-label-sm">Uraian</label>
          <textarea
            value={itemData.uraian || ''}
            onChange={(e) => handleInputChange('uraian', e.target.value)}
            className="form-input min-h-[80px]"
            placeholder="Deskripsi belanja..."
          ></textarea>
        </div>

        {showCatatan && (
          <div className="animate-fadeIn">
            <label className="form-label-sm flex items-center gap-1.5 text-orange-700">
              <MessageSquareText size={15} /> Catatan Pemeriksa
            </label>
            <textarea
              value={itemData.catatan || ''}
              onChange={(e) => handleInputChange('catatan', e.target.value)}
              className={`form-input min-h-[80px] ${
                !isSupervisor
                  ? 'bg-orange-50 border-orange-200 text-orange-800'
                  : 'bg-white border-orange-300 focus:ring-orange-200'
              }`}
              placeholder={isSupervisor ? 'Tulis catatan perbaikan...' : ''}
              disabled={!isSupervisor}
            ></textarea>
          </div>
        )}
      </div>

      {/* --- Row 3: Flags / Checklist (Redesigned) --- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <CheckCheck size={18} className="text-bpsBlue" />
            Kelengkapan Dokumen
          </h4>

          {flags && flags.length > 0 && (
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setAllFlags('IYA')}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors border border-green-200 font-medium"
              >
                <CheckCheck size={14} /> Tandai Semua Ada
              </button>
              <button
                type="button"
                onClick={resetAllFlags}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 transition-colors border border-slate-200"
              >
                <RotateCcw size={14} /> Reset
              </button>
            </div>
          )}
        </div>

        {isLoadingFlags && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-transparent rounded-full"></div>
            Memuat checklist...
          </div>
        )}

        {!isLoadingFlags && (!flags || flags.length === 0) && (
          <div className="text-sm text-gray-400 italic py-2 bg-slate-50 px-4 rounded border border-slate-100">
            Pilih Kode Akun di atas untuk memuat daftar dokumen yang diperlukan.
          </div>
        )}

        {flags && flags.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
            {flags.map((flag) => {
              const currentVal = getFlagValue(flag.nama);
              const isFilled = currentVal !== '';

              return (
                <div
                  key={flag.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isFilled
                      ? 'bg-white border-slate-200'
                      : 'bg-slate-50 border-slate-100'
                  }`}
                >
                  <div
                    className="text-xs font-semibold text-gray-700 mb-2 min-h-[20px] line-clamp-2"
                    title={flag.nama}
                  >
                    {flag.nama}
                  </div>

                  <div className="flex gap-1.5">
                    <FlagButton
                      label="Ada"
                      icon={Check}
                      isActive={currentVal === 'IYA'}
                      onClick={() => updateFlag(flag.nama, 'IYA')}
                      colorClass="bg-white text-gray-400 border-gray-200"
                      activeColorClass="bg-green-100 text-green-700 border-green-500 font-bold"
                      title="Dokumen Lengkap"
                    />

                    {flag.tipe === 'IYA_TIDAK' && (
                      <FlagButton
                        label="-"
                        icon={Minus}
                        isActive={currentVal === 'IYA_TIDAK'}
                        onClick={() => updateFlag(flag.nama, 'IYA_TIDAK')}
                        colorClass="bg-white text-gray-400 border-gray-200"
                        activeColorClass="bg-slate-100 text-slate-700 border-slate-500 font-bold"
                        title="Tidak Diperlukan (Valid)"
                      />
                    )}

                    <FlagButton
                      label="Tidak"
                      icon={X}
                      isActive={currentVal === 'TIDAK'}
                      onClick={() => updateFlag(flag.nama, 'TIDAK')}
                      colorClass="bg-white text-gray-400 border-gray-200"
                      activeColorClass="bg-red-100 text-red-700 border-red-500 font-bold"
                      title="Dokumen Tidak Ada"
                    />

                    <FlagButton
                      label="Belum"
                      icon={Clock}
                      isActive={currentVal === 'BELUM_SELESAI'}
                      onClick={() => updateFlag(flag.nama, 'BELUM_SELESAI')}
                      colorClass="bg-white text-gray-400 border-gray-200"
                      activeColorClass="bg-orange-100 text-orange-700 border-orange-500 font-bold"
                      title="Proses Belum Selesai"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RincianItem;

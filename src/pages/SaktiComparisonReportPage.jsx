// src/pages/SaktiComparisonReportPage.jsx

import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api';
import { useSatker } from '../contexts/SatkerContext';
import {
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  MinusCircle,
  Info,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Pagination from '../components/Pagination';

// Helper functions
const formatCurrency = (number) => {
  if (number === null || number === undefined) return '-';
  const numericValue = Number(number);
  if (isNaN(numericValue)) return '-';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(numericValue);
};

const getStatusProps = (status) => {
  switch (status) {
    case 'MATCH':
      return {
        Icon: CheckCircle,
        color: 'text-green-600',
        text: 'Sesuai',
        bgColor: 'bg-green-50',
      };
    case 'MISMATCH':
      return {
        Icon: AlertTriangle,
        color: 'text-red-600',
        text: 'Tidak Sesuai',
        bgColor: 'bg-red-50',
      };
    case 'NOT_FOUND':
      return {
        Icon: MinusCircle,
        color: 'text-yellow-600',
        text: 'Tidak Ditemukan',
        bgColor: 'bg-yellow-50',
      };
    default:
      return {
        Icon: Info,
        color: 'text-gray-500',
        text: 'N/A',
        bgColor: 'bg-gray-50',
      };
  }
};

function SaktiComparisonReportPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const { tahunAnggaran, isContextSet, selectedSatkerId } = useSatker();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const {
    mutate: validateReport,
    isPending,
    data: validationResponse,
    error: validationError,
    reset,
  } = useMutation({
    mutationFn: (parsedData) =>
      apiClient.post(
        `/spm/validate-report?tahun=${tahunAnggaran}&satkerId=${selectedSatkerId}`,
        parsedData
      ),
    onError: (err) => {
      console.error('Validation API call failed:', err);
    },
    onSuccess: (response) => {
      console.log('Validation successful, API returned response:', response);
      setCurrentPage(1);
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      reset();
      setCurrentPage(1);
    } else {
      setFile(null);
      setFileName('');
      reset();
      setCurrentPage(1);
    }
  };

  const canValidate = isContextSet && selectedSatkerId;

  const handleUploadAndValidate = () => {
    if (!file || !canValidate) {
      if (!canValidate) {
        alert(
          'Harap pilih Satuan Kerja spesifik di Dashboard terlebih dahulu (bukan "Semua Satker").'
        );
      }
      return;
    }
    reset();
    setCurrentPage(1);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target.result;
      let parsedDataRows = [];
      try {
        if (file.name.endsWith('.csv')) {
          const result = Papa.parse(fileData, {
            header: false,
            skipEmptyLines: true,
          });
          if (
            !result.data ||
            result.data.length < 5 ||
            result.data[0].length < 23
          ) {
            throw new Error('Format CSV tidak sesuai atau file kosong/rusak.');
          }
          parsedDataRows = result.data;
        } else if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(fileData, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) throw new Error('File XLSX tidak memiliki sheet.');
          const worksheet = workbook.Sheets[sheetName];
          parsedDataRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          if (!parsedDataRows || parsedDataRows.length < 5) {
            throw new Error('Format XLSX tidak sesuai atau file kosong/rusak.');
          }
        } else {
          throw new Error(
            'Format file tidak didukung. Harap unggah file .csv atau .xlsx.'
          );
        }
        validateReport({ data: parsedDataRows });
      } catch (parseError) {
        console.error('File parsing error:', parseError);
        alert(
          `Gagal memproses file: ${parseError.message}. Pastikan format file SAKTI sudah benar.`
        );
        reset();
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = (err) => {
      console.error('File reading error:', err);
      alert('Gagal membaca file.');
      setIsParsing(false);
      reset();
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const isProcessing = isParsing || isPending;
  const allResults = validationResponse?.data;

  const sortedResults = useMemo(() => {
    if (!Array.isArray(allResults)) {
      return [];
    }
    return [...allResults].sort((a, b) => {
      const aFound = a.status !== 'NOT_FOUND';
      const bFound = b.status !== 'NOT_FOUND';

      if (aFound && !bFound) return -1;
      if (!aFound && bFound) return 1;

      if (a.spmNomor !== b.spmNomor) {
        return (a.spmNomor || '').localeCompare(b.spmNomor || '');
      }
      return (a.rincianUraian || '').localeCompare(b.rincianUraian || '');
    });
  }, [allResults]);

  const totalItems = sortedResults.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = sortedResults.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Laporan Biaya SAKTI
        </h1>
        <p className="text-gray-500 mt-1">
          {canValidate
            ? `Bandingkan data aplikasi dengan laporan SAKTI tahun ${tahunAnggaran}.`
            : 'Harap atur konteks (Satker Spesifik & Tahun) di Dashboard.'}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Unggah Laporan SAKTI
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <label htmlFor="file-upload" className="flex-grow">
            <div
              className={`flex items-center justify-center w-full h-24 sm:h-auto sm:min-h-[5rem] px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none ${
                canValidate
                  ? 'cursor-pointer hover:border-gray-400'
                  : 'cursor-not-allowed bg-gray-50'
              } focus:outline-none`}
            >
              <span className="flex items-center space-x-2">
                <UploadCloud className="w-6 h-6 text-gray-600" />
                <span className="font-medium text-gray-600 text-sm sm:text-base">
                  {fileName
                    ? `File: ${fileName}`
                    : 'Pilih file Laporan Realisasi (.xlsx)...'}
                </span>
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
                disabled={!canValidate}
              />
            </div>
          </label>
          <button
            onClick={handleUploadAndValidate}
            disabled={!file || isProcessing || !canValidate}
            className="btn-primary h-auto sm:h-full px-6 py-3 sm:px-8 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              !canValidate
                ? 'Harap pilih Satker spesifik di Dashboard dulu'
                : ''
            }
          >
            {isProcessing ? 'Memproses...' : 'Bandingkan Data'}
          </button>
        </div>
        {!canValidate && (
          <p className="mt-4 text-sm text-orange-600 flex items-center gap-1">
            <Info size={16} />
            Anda harus memilih <strong>Satuan Kerja spesifik</strong> (bukan
            "Semua Satker") dan Tahun Anggaran di Dashboard.
          </p>
        )}
        {validationError && (
          <p className="mt-4 text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle size={16} />
            Terjadi kesalahan:{' '}
            {validationError.response?.data?.error || validationError.message}
          </p>
        )}
      </div>

      {isProcessing && (
        <div className="bg-white rounded-xl shadow-md p-6 text-center text-gray-500">
          Membandingkan data...
        </div>
      )}

      {!isProcessing && (validationResponse || validationError) && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <h2 className="text-xl font-bold text-gray-800 p-6 border-b">
            Hasil Perbandingan (Tahun {tahunAnggaran})
          </h2>

          {validationError && (
            <p className="p-6 text-center text-red-500 italic">
              Gagal memuat data.
            </p>
          )}

          {!validationError && Array.isArray(allResults) && (
            <>
              {sortedResults.length === 0 ? (
                <p className="p-6 text-center text-gray-500">
                  Tidak ada data rincian yang cocok ditemukan.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-20">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 border-r">
                            SPM Ref.
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Akun & Uraian (Aplikasi)
                          </th>

                          {/* Removed Pagu Columns */}

                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jumlah (Aplikasi)
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Realisasi (SAKTI)
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Selisih
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentItems.map((result, index) => {
                          const { Icon, color, text, bgColor } = getStatusProps(
                            result.status
                          );
                          const isMismatch = result.status === 'MISMATCH';
                          const isNotFound = result.status === 'NOT_FOUND';

                          return (
                            <tr
                              key={`${result.spmNomor}-${result.rincianUraian}-${index}`}
                              className={`${
                                isMismatch
                                  ? 'bg-red-50 hover:bg-red-100'
                                  : isNotFound
                                  ? 'bg-yellow-50 hover:bg-yellow-100'
                                  : 'hover:bg-gray-50'
                              } transition-colors duration-150 ease-in-out`}
                            >
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-xs text-gray-500 sticky left-0 z-10 border-r ${
                                  isMismatch
                                    ? 'bg-red-50'
                                    : isNotFound
                                    ? 'bg-yellow-50'
                                    : 'bg-white group-hover:bg-gray-50'
                                }`}
                              >
                                {result.spmNomor || 'N/A'}
                              </td>
                              <td
                                className="px-6 py-4 text-sm text-gray-800 max-w-sm"
                                title={result.rincianUraian}
                              >
                                {result.kodeAkun ? (
                                  <span className="font-mono text-xs block text-gray-500">
                                    {result.kodeAkun} - {result.kodeAkunNama}
                                  </span>
                                ) : (
                                  ''
                                )}
                                <span className="block truncate">
                                  {result.rincianUraian}
                                </span>
                              </td>

                              {/* Removed Pagu Data Cells */}

                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                {formatCurrency(result.appAmount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-right font-mono">
                                {formatCurrency(result.saktiAmount)}
                              </td>
                              <td
                                className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold ${
                                  isMismatch ? 'text-red-700' : 'text-gray-700'
                                }`}
                              >
                                {formatCurrency(result.difference)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${bgColor}`}
                                >
                                  <Icon size={14} />
                                  {text}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SaktiComparisonReportPage;

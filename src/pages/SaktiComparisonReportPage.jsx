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
  Download,
  FileText, // [ADDED] Icon for PDF
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf'; // [ADDED]
import autoTable from 'jspdf-autotable'; // [ADDED]
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
  const itemsPerPage = 10;

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
    onError: (err) => console.error('Validation API call failed:', err),
    onSuccess: () => setCurrentPage(1),
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
    }
  };

  const canValidate = isContextSet && selectedSatkerId;

  const handleUploadAndValidate = () => {
    if (!file || !canValidate) {
      if (!canValidate)
        alert(
          'Harap pilih Satuan Kerja spesifik di Dashboard terlebih dahulu.'
        );
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
          parsedDataRows = result.data;
        } else if (file.name.endsWith('.xlsx')) {
          const workbook = XLSX.read(fileData, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedDataRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
          throw new Error('Format file tidak didukung.');
        }

        if (!parsedDataRows || parsedDataRows.length < 5)
          throw new Error('File terlihat kosong atau rusak.');

        validateReport({ data: parsedDataRows });
      } catch (parseError) {
        console.error('File parsing error:', parseError);
        alert(`Gagal memproses file: ${parseError.message}`);
        reset();
      } finally {
        setIsParsing(false);
      }
    };
    reader.onerror = () => {
      alert('Gagal membaca file.');
      setIsParsing(false);
      reset();
    };

    if (file.name.endsWith('.csv')) reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  const isProcessing = isParsing || isPending;
  const allResults = validationResponse?.data;

  const sortedResults = useMemo(() => {
    if (!Array.isArray(allResults)) return [];
    return [...allResults].sort((a, b) => {
      const aFound = a.status !== 'NOT_FOUND';
      const bFound = b.status !== 'NOT_FOUND';
      if (aFound && !bFound) return -1;
      if (!aFound && bFound) return 1;
      return (a.spmNomor || '').localeCompare(b.spmNomor || '');
    });
  }, [allResults]);

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (!sortedResults || sortedResults.length === 0) return;

    const dataToExport = sortedResults.map((item) => ({
      'No. SPM': item.spmNomor || 'N/A',
      Program: item.kodeProgram || '-',
      Kegiatan: item.kodeKegiatan || '-',
      KRO: item.kodeKRO || '-',
      RO: item.kodeRO || '-',
      Komp: item.kodeKomponen || '-',
      Sub: item.kodeSubkomponen || '-',
      'Kode Akun': item.kodeAkun || '-',
      'Nama Akun': item.kodeAkunNama || '-',
      Uraian: item.rincianUraian || '-',
      'Jml Aplikasi': item.appAmount || 0,
      'Realisasi SAKTI': item.saktiAmount || 0,
      Selisih: item.difference || 0,
      Status:
        item.status === 'MATCH'
          ? 'Sesuai'
          : item.status === 'MISMATCH'
          ? 'Tidak Sesuai'
          : 'Tidak Ditemukan',
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 5 },
      { wch: 10 },
      { wch: 25 },
      { wch: 40 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Komparasi');
    XLSX.writeFile(wb, `Komparasi_SAKTI_${tahunAnggaran}.xlsx`);
  };

  // --- EXPORT PDF ---
  const handleExportPDF = () => {
    if (!sortedResults || sortedResults.length === 0) return;

    const doc = new jsPDF('landscape', 'mm', 'a4'); // A4 Landscape

    // Header
    doc.setFontSize(14);
    doc.text(`Laporan Komparasi SAKTI - Tahun ${tahunAnggaran}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    // Columns for PDF
    const tableColumn = [
      'No. SPM',
      'Akun/Uraian',
      'Anggaran',
      'Jml App (Rp)',
      'SAKTI (Rp)',
      'Selisih (Rp)',
      'Status',
    ];

    // Map Data
    const tableRows = sortedResults.map((item) => {
      // Create concise strings to save space
      const anggaran = `${item.kodeProgram?.split('.')[1] || ''}/${
        item.kodeKegiatan
      }/${item.kodeKRO}.${item.kodeRO}/${item.kodeKomponen}.${
        item.kodeSubkomponen
      }`;
      const uraian = `${item.kodeAkun}\n${item.rincianUraian?.substring(
        0,
        50
      )}${item.rincianUraian?.length > 50 ? '...' : ''}`;

      let statusText = 'N/A';
      if (item.status === 'MATCH') statusText = 'Sesuai';
      else if (item.status === 'MISMATCH') statusText = 'Tidak Sesuai';
      else if (item.status === 'NOT_FOUND') statusText = 'Tidak Ditemukan';

      return [
        item.spmNomor || '-',
        uraian,
        anggaran,
        formatCurrency(item.appAmount),
        formatCurrency(item.saktiAmount),
        formatCurrency(item.difference),
        statusText,
      ];
    });

    // Generate Table
    autoTable(doc, {
      startY: 25,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 43, 106] }, // BPS Blue
      styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
      columnStyles: {
        0: { cellWidth: 35 }, // No SPM
        1: { cellWidth: 80 }, // Uraian (Wider)
        2: { cellWidth: 40 }, // Anggaran Codes
        6: { cellWidth: 25, fontStyle: 'bold' }, // Status
      },
      didParseCell: function (data) {
        // Colorize Status column rows based on content
        if (data.section === 'body' && data.column.index === 6) {
          if (data.cell.raw === 'Tidak Sesuai')
            data.cell.styles.textColor = [220, 38, 38]; // Red
          if (data.cell.raw === 'Sesuai')
            data.cell.styles.textColor = [22, 163, 74]; // Green
          if (data.cell.raw === 'Tidak Ditemukan')
            data.cell.styles.textColor = [202, 138, 4]; // Yellow/Orange
        }
      },
    });

    doc.save(`Komparasi_SAKTI_${tahunAnggaran}.pdf`);
  };

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

      {/* Upload Box */}
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
              }`}
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
                accept=".csv, .xlsx"
                className="hidden"
                onChange={handleFileChange}
                disabled={!canValidate}
              />
            </div>
          </label>
          <button
            onClick={handleUploadAndValidate}
            disabled={!file || isProcessing || !canValidate}
            className="btn-primary h-auto sm:h-full px-6 py-3 sm:px-8 text-base disabled:opacity-50"
          >
            {isProcessing ? 'Memproses...' : 'Bandingkan Data'}
          </button>
        </div>
        {validationError && (
          <p className="mt-4 text-sm text-red-600 flex items-center gap-1">
            <AlertTriangle size={16} /> Error:{' '}
            {validationError.response?.data?.error || validationError.message}
          </p>
        )}
      </div>

      {/* Results Table */}
      {!isProcessing && validationResponse && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="flex flex-wrap items-center justify-between p-6 border-b gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              Hasil Perbandingan
            </h2>

            {!validationError && sortedResults.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportExcel}
                  className="btn-success flex items-center gap-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md"
                >
                  <Download size={16} /> Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="btn-danger flex items-center gap-2 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md"
                >
                  <FileText size={16} /> PDF
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 border-r w-32">
                    SPM Ref.
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Prog
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Keg
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    KRO/RO
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Komp/Sub
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Akun / Uraian
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Jumlah (App)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Realisasi (SAKTI)
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Selisih
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((result, index) => {
                  const { Icon, color, text, bgColor } = getStatusProps(
                    result.status
                  );
                  const isErr =
                    result.status === 'MISMATCH' ||
                    result.status === 'NOT_FOUND';

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-gray-50 ${
                        isErr
                          ? result.status === 'MISMATCH'
                            ? 'bg-red-50'
                            : 'bg-yellow-50'
                          : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-500 font-medium sticky left-0 bg-inherit border-r">
                        {result.spmNomor || '-'}
                      </td>
                      <td className="px-2 py-3 text-xs text-center text-gray-600 font-mono">
                        {result.kodeProgram?.split('.')[1] ||
                          result.kodeProgram}
                      </td>
                      <td className="px-2 py-3 text-xs text-center text-gray-600 font-mono">
                        {result.kodeKegiatan}
                      </td>
                      <td className="px-2 py-3 text-xs text-center text-gray-600 font-mono">
                        <div>{result.kodeKRO}</div>
                        <div className="text-gray-400">{result.kodeRO}</div>
                      </td>
                      <td className="px-2 py-3 text-xs text-center text-gray-600 font-mono">
                        <div>{result.kodeKomponen}</div>
                        <div className="text-gray-400">
                          {result.kodeSubkomponen}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 max-w-xs">
                        <div className="font-mono text-xs text-gray-500 mb-0.5">
                          {result.kodeAkun}
                        </div>
                        <div className="truncate" title={result.rincianUraian}>
                          {result.rincianUraian}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-700">
                        {formatCurrency(result.appAmount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-mono text-gray-700">
                        {formatCurrency(result.saktiAmount)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-mono font-bold ${
                          result.difference !== 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(result.difference)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${color} ${bgColor}`}
                        >
                          <Icon size={12} /> {text}
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
              onPageChange={setCurrentPage}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SaktiComparisonReportPage;

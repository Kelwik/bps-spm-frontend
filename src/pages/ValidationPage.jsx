import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api';
import {
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  MinusCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const formatCurrency = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

function ValidationPage() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const {
    mutate: validateReport,
    isPending,
    data: validationResult,
  } = useMutation({
    mutationFn: (parsedData) =>
      apiClient.post('/spm/validate-report', parsedData),
    onSuccess: () => {
      console.log('Validation successful! Response received from backend.');
    },
    onError: (err) => {
      console.error('Validation API call failed:', err);
      alert(`Validasi gagal: ${err.response?.data?.error || err.message}`);
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log('File selected:', selectedFile.name);
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleUploadAndValidate = () => {
    console.log('Validasi button clicked.');
    if (!file) {
      console.log('No file selected. Aborting.');
      return;
    }
    setIsParsing(true);
    console.log('Step 1: Start parsing...');

    const reader = new FileReader();
    reader.onload = (e) => {
      const fileData = e.target.result;
      let parsedDataRows = [];

      try {
        console.log('Step 2: File read successfully. Checking extension...');
        if (file.name.endsWith('.csv')) {
          console.log('Parsing as CSV...');
          const result = Papa.parse(fileData, {
            header: false,
            skipEmptyLines: true,
          });
          parsedDataRows = result.data;
        } else if (file.name.endsWith('.xlsx')) {
          console.log('Parsing as XLSX...');
          const workbook = XLSX.read(fileData, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          parsedDataRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        } else {
          alert('Format file tidak didukung.');
          setIsParsing(false);
          return;
        }

        console.log('Step 3: Parsing complete. Sending data to backend...', {
          data: parsedDataRows,
        });
        validateReport({ data: parsedDataRows });
      } catch (parseError) {
        console.error('Step E1: File parsing error:', parseError);
        alert(
          'Gagal memproses file. Pastikan formatnya benar dan tidak rusak.'
        );
      } finally {
        // We set parsing to false, but isPending will keep the button disabled.
        setIsParsing(false);
      }
    };

    reader.onerror = (err) => {
      console.error('Step E2: File reading error:', err);
      alert('Gagal membaca file.');
      setIsParsing(false);
    };

    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  };

  const isProcessing = isParsing || isPending;
  const results = validationResult?.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Validasi Laporan SAKTI
        </h1>
        <p className="text-gray-500 mt-1">
          Unggah file Laporan Realisasi Anggaran dari SAKTI untuk
          membandingkannya dengan data SPM di aplikasi.
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <label htmlFor="file-upload" className="w-full">
            <div className="flex items-center justify-center w-full h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
              <span className="flex items-center space-x-2">
                <UploadCloud className="w-6 h-6 text-gray-600" />
                <span className="font-medium text-gray-600">
                  {fileName
                    ? `File terpilih: ${fileName}`
                    : 'Klik untuk memilih file .csv atau .xlsx...'}
                </span>
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </label>
          <button
            onClick={handleUploadAndValidate}
            disabled={!file || isProcessing}
            className="btn-primary h-32 px-8"
          >
            {isProcessing ? 'Memproses...' : 'Validasi'}
          </button>
        </div>

        {results && Array.isArray(results) && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Hasil Validasi
            </h2>
            <div className="space-y-3">
              {results.length === 0 ? (
                <p className="text-gray-500">
                  Tidak ada data SPM yang dapat divalidasi untuk tahun anggaran
                  ini.
                </p>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-md ${
                      result.status === 'MATCH'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'MISMATCH'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div>
                        {result.status === 'MATCH' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {result.status === 'MISMATCH' && (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        )}
                        {result.status === 'NOT_FOUND' && (
                          <MinusCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`font-semibold ${
                            result.status === 'MATCH'
                              ? 'text-green-800'
                              : result.status === 'MISMATCH'
                              ? 'text-red-800'
                              : 'text-yellow-800'
                          }`}
                        >
                          {result.spmNomor} - {result.status.replace('_', ' ')}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {result.rincianUraian}
                        </p>
                        {result.status === 'MISMATCH' && (
                          <div className="mt-2 text-sm space-y-1 p-2 bg-red-100 rounded-md">
                            <p>
                              Jumlah Aplikasi:{' '}
                              <span className="font-mono font-semibold">
                                {formatCurrency(result.appAmount)}
                              </span>
                            </p>
                            <p>
                              Realisasi SAKTI:{' '}
                              <span className="font-mono font-semibold">
                                {formatCurrency(result.saktiAmount)}
                              </span>
                            </p>
                            <p>
                              Selisih:{' '}
                              <span className="font-mono font-bold text-red-700">
                                {formatCurrency(result.difference)}
                              </span>
                            </p>
                          </div>
                        )}
                        {result.status === 'NOT_FOUND' && (
                          <p className="mt-2 text-sm text-yellow-700">
                            Rincian ini tidak dapat ditemukan padanannya di
                            laporan SAKTI.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidationPage;

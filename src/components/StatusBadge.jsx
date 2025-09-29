function StatusBadge({ status }) {
  const statusStyles = {
    MENUNGGU: 'bg-yellow-100 text-yellow-800',
    DITOLAK: 'bg-red-100 text-red-800',
    DITERIMA: 'bg-green-100 text-green-800',
  };

  const statusText = {
    MENUNGGU: 'Menunggu Persetujuan',
    DITOLAK: 'Ditolak (Perlu Revisi)',
    DITERIMA: 'Diterima',
  };

  return (
    <span
      className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
        statusStyles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {statusText[status] || 'Tidak Diketahui'}
    </span>
  );
}

export default StatusBadge;

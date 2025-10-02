function ProgressBar({ percentage }) {
  const roundedPercentage = Math.round(percentage || 0);

  // --- PERUBAHAN WARNA DI SINI ---
  // Menggunakan warna-warna yang lebih cerah dan "pop"
  const getColor = () => {
    if (roundedPercentage < 50) return 'bg-red-500'; // Merah cerah
    if (roundedPercentage < 90) return 'bg-yellow-400'; // Kuning cerah
    return 'bg-green-500'; // Hijau cerah
  };

  return (
    <div className="flex items-center gap-3">
      {/* Bar Container */}
      <div className="w-full bg-slate-200 rounded-full h-2.5">
        {/* Bar Progres yang terisi */}
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${getColor()}`}
          style={{ width: `${roundedPercentage}%` }}
        />
      </div>
      {/* Teks Persentase */}
      <div className="w-12 text-right">
        <span className="text-sm font-semibold text-slate-700">
          {`${roundedPercentage}%`}
        </span>
      </div>
    </div>
  );
}

export default ProgressBar;

function PercentageCircle({ percentage }) {
  const sqSize = 40;
  const strokeWidth = 5;
  const radius = (sqSize - strokeWidth) / 2;
  const viewBox = `0 0 ${sqSize} ${sqSize}`;
  const circumference = radius * Math.PI * 2;
  const dashOffset = circumference - (circumference * (percentage || 0)) / 100;

  // Tentukan warna berdasarkan persentase
  const getStrokeColor = () => {
    if (!percentage || percentage < 50) return 'stroke-red-500';
    if (percentage < 90) return 'stroke-yellow-500';
    return 'stroke-green-500';
  };

  return (
    <div className="relative w-10 h-10">
      <svg width="100%" height="100%" viewBox={viewBox}>
        <circle
          className="stroke-current text-gray-200"
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          fill="none"
        />
        <circle
          className={`stroke-current ${getStrokeColor()} transition-all duration-500 ease-in-out`}
          cx={sqSize / 2}
          cy={sqSize / 2}
          r={radius}
          strokeWidth={`${strokeWidth}px`}
          transform={`rotate(-90 ${sqSize / 2} ${sqSize / 2})`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: dashOffset,
            strokeLinecap: 'round',
          }}
          fill="none"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
        {`${Math.round(percentage || 0)}%`}
      </span>
    </div>
  );
}

export default PercentageCircle;

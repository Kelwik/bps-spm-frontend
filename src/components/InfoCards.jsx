import { Check, Clock4, FileSpreadsheet, X } from 'lucide-react';

function InfoCards({ data }) {
  return (
    <div className="flex w-full gap-4">
      <div className="p-4 py-6 bg-white flex gap-2 w-1/4 font-lato border-t-8 shadow-md border-bpsBlue rounded-lg">
        <div className="bg-bpsBlue p-2 rounded-lg">
          <FileSpreadsheet
            color="white
          "
            size={32}
          />
        </div>
        <div>
          <h1 className="font-bold text-sm">Total SPM</h1>
          <p className="font-black text-lg">{data.length}</p>
        </div>
      </div>
      <div className="p-4 py-6 bg-white flex gap-2 w-1/4 font-lato border-t-8 shadow-md border-[#43a047] rounded-lg">
        <div className="bg-[#43a047] p-2 rounded-lg">
          <Check
            color="white
          "
            size={32}
          />
        </div>
        <div>
          <h1 className="font-bold text-sm">Disetujui</h1>
          <p className="font-black text-lg">124</p>
        </div>
      </div>
      <div className="p-4 py-6 bg-white flex gap-2 w-1/4 font-lato border-t-8 shadow-md border-[#f44336] rounded-lg">
        <div className="bg-[#f44336] p-2 rounded-lg">
          <X
            color="white
          "
            size={32}
          />
        </div>
        <div>
          <h1 className="font-bold text-sm">Ditolak</h1>
          <p className="font-black text-lg">10</p>
        </div>
      </div>
      <div className="p-4 py-6 bg-white flex gap-2 w-1/4 font-lato border-t-8 shadow-md border-[#ff9800] rounded-lg">
        <div className="bg-[#ff9800] p-2 rounded-lg">
          <Clock4
            color="white
          "
            size={32}
          />
        </div>
        <div>
          <h1 className="font-bold text-sm">Menunggu</h1>
          <p className="font-black text-lg">26</p>
        </div>
      </div>
    </div>
  );
}

export default InfoCards;

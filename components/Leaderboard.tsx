
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../utils';

interface LeaderboardProps {
  lastUpdate?: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ lastUpdate }) => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setScores(getLeaderboard());
  }, [lastUpdate]);

  return (
    <div className="bg-white/95 text-gray-800 p-3 rounded-lg border-4 border-gray-900 w-full shadow-lg h-fit max-w-[320px]">
      <h3 className="text-sm text-center mb-3 font-bold border-b-2 border-gray-300 pb-1 uppercase tracking-tighter">🏆 Leaderboard</h3>
      {scores.length === 0 ? (
        <p className="text-center text-[10px] py-4 text-gray-500 italic">Ninguém jogou ainda...</p>
      ) : (
        <ul className="space-y-1.5 text-[9px] max-h-48 overflow-y-auto pr-1">
          {scores.map((entry, idx) => (
            <li key={idx} className="flex justify-between items-center p-1.5 bg-gray-50 rounded border-b border-gray-200 last:border-0">
              <span className="flex items-center">
                <span className={`w-5 h-5 mr-2 flex items-center justify-center rounded-full text-[8px] font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-600'}`}>
                  {idx + 1}
                </span>
                <span className="truncate max-w-[70px] font-bold" title={entry.name}>{entry.name}</span>
              </span>
              <div className="flex gap-2 items-center font-mono">
                  <span className="font-black text-blue-700">{entry.score}m</span>
                  <span className="text-gray-400">|</span>
                  <span className="font-black text-yellow-600">🦴{entry.kibble}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Leaderboard;

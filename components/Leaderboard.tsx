import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../utils';

const Leaderboard: React.FC = () => {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setScores(getLeaderboard());
  }, []);

  return (
    <div className="bg-white/90 text-gray-800 p-4 rounded-lg border-4 border-gray-900 max-w-md w-full shadow-lg">
      <h3 className="text-xl text-center mb-4 font-bold border-b-2 border-gray-300 pb-2">🏆 Leaderboard</h3>
      {scores.length === 0 ? (
        <p className="text-center text-sm">No scores yet. Be the first!</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {scores.map((entry, idx) => (
            <li key={idx} className="flex justify-between items-center p-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
              <span className="flex items-center">
                <span className={`w-6 h-6 mr-2 flex items-center justify-center rounded-full text-xs font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-600' : 'bg-gray-600'}`}>
                  {idx + 1}
                </span>
                {entry.name}
              </span>
              <span className="font-mono font-bold text-blue-600">{entry.score}pts</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Leaderboard;
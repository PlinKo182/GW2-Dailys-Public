import React from 'react';

const DailyProgress = ({ overallProgress }) => {
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-2">
        <p className="text-base font-medium text-gray-300">Overall Progress</p>
        <p className="text-base font-medium text-emerald-400">{overallProgress}%</p>
      </div>
      <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${overallProgress}%` }}
        />
      </div>
    </div>
  );
};

export default DailyProgress;
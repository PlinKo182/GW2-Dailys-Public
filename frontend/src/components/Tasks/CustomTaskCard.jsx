import React from 'react';

const CustomTaskCard = ({ card }) => {
  // Placeholder content
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col">
      <div className="p-6">
        <h3 className="text-xl font-bold text-primary">{card.title}</h3>
        {/* Task items will be rendered here */}
      </div>
    </div>
  );
};

export default CustomTaskCard;
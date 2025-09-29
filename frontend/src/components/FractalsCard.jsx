import React from 'react';

const FractalsCard = () => {
  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col hover:shadow-xl transition-all duration-300">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-primary mb-4">
          Daily Fractals
        </h3>
        <div className="space-y-3 text-muted-foreground">
          <p>This is a placeholder for the daily fractals information.</p>
          <p>The logic for this card will be implemented in a future update.</p>
        </div>
      </div>
    </div>
  );
};

export default FractalsCard;
export const formatPriceWithImages = (copper) => {
  if (!copper) return null;
  
  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const copperRemaining = copper % 100;
  
  return (
    <div className="flex items-center gap-1 text-yellow-400 text-sm">
      {gold > 0 && (
        <span className="flex items-center gap-1">
          {gold}
          <img 
            src="https://wiki.guildwars2.com/images/d/d1/Gold_coin.png" 
            alt="Gold" 
            className="w-3 h-3 object-contain" 
          />
        </span>
      )}
      {silver > 0 && (
        <span className="flex items-center gap-1">
          {silver}
          <img 
            src="https://wiki.guildwars2.com/images/3/3c/Silver_coin.png" 
            alt="Silver" 
            className="w-3 h-3 object-contain" 
          />
        </span>
      )}
      {copperRemaining > 0 && (
        <span className="flex items-center gap-1">
          {copperRemaining}
          <img 
            src="https://wiki.guildwars2.com/images/e/eb/Copper_coin.png" 
            alt="Copper" 
            className="w-3 h-3 object-contain" 
          />
        </span>
      )}
    </div>
  );
};
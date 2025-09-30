import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Award, List } from 'lucide-react';

// Data mapping from the user's script
const scaleToFractal = { 1:"Molten Furnace",2:"Uncategorized",3:"Snowblind",4:"Urban Battleground",5:"Swampland",6:"Cliffside",7:"Aquatic Ruins",8:"Underground Facility",9:"Molten Boss",10:"Molten Furnace",11:"Uncategorized",12:"Snowblind",13:"Urban Battleground",14:"Swampland",15:"Cliffside",16:"Aquatic Ruins",17:"Underground Facility",18:"Molten Boss",19:"Thaumanova Reactor",20:"Solid Ocean",21:"Uncategorized",22:"Snowblind",23:"Urban Battleground",24:"Swampland",25:"Cliffside",26:"Aquatic Ruins",27:"Underground Facility",28:"Molten Boss",29:"Thaumanova Reactor",30:"Solid Ocean",31:"Aetherblade",32:"Swampland",33:"Uncategorized",34:"Snowblind",35:"Urban Battleground",36:"Cliffside",37:"Aquatic Ruins",38:"Underground Facility",39:"Molten Boss",40:"Thaumanova Reactor",41:"Solid Ocean",42:"Aetherblade",43:"Captain Mai Trin Boss",44:"Chaos",45:"Nightmare",46:"Shattered Observatory",47:"Twilight Oasis",48:"Sunqua Peak",49:"Silent Surf",50:"Siren's Reef",51:"Deepstone",52:"Malicious Forgeman",53:"Molten Furnace",54:"Uncategorized",55:"Snowblind",56:"Urban Battleground",57:"Swampland",58:"Cliffside",59:"Aquatic Ruins",60:"Underground Facility",61:"Molten Boss",62:"Thaumanova Reactor",63:"Solid Ocean",64:"Aetherblade",65:"Underground Facility",66:"Captain Mai Trin Boss",67:"Chaos",68:"Nightmare",69:"Shattered Observatory",70:"Twilight Oasis",71:"Sunqua Peak",72:"Silent Surf",73:"Siren's Reef",74:"Deepstone",75:"Malicious Forgeman",76:"Molten Furnace",77:"Uncategorized",78:"Snowblind",79:"Urban Battleground",80:"Swampland",81:"Cliffside",82:"Aquatic Ruins",83:"Underground Facility",84:"Molten Boss",85:"Thaumanova Reactor",86:"Solid Ocean",87:"Aetherblade",88:"Captain Mai Trin Boss",89:"Chaos",90:"Nightmare",91:"Shattered Observatory",92:"Twilight Oasis",93:"Sunqua Peak",94:"Silent Surf",95:"Siren's Reef",96:"Deepstone",97:"Malicious Forgeman",98:"Uncategorized",99:"Snowblind",100:"Urban Battleground"};

const FractalsCard = () => {
  const [recommended, setRecommended] = useState([]);
  const [dailies, setDailies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFractals = async () => {
      setLoading(true);
      setError(null);
      try {
        const categoryResponse = await axios.get("https://api.guildwars2.com/v2/achievements/categories/88");
        const achievementIds = categoryResponse.data.achievements;

        const achievementsResponse = await axios.get(`https://api.guildwars2.com/v2/achievements?ids=${achievementIds.join(',')}`);
        const achievements = achievementsResponse.data;

        const recommendedFractals = new Map();
        const dailyFractals = new Set();

        achievements.forEach(ach => {
          if (ach.name.includes("Recommended")) {
            try {
              const scale = parseInt(ach.name.split("Scale ")[1], 10);
              const fractalName = scaleToFractal[scale] || `Scale ${scale}`;
              recommendedFractals.set(scale, fractalName);
            } catch (e) { /* Ignore parsing fails */ }
          } else if (["Tier 1", "Tier 2", "Tier 3", "Tier 4"].some(tier => ach.name.includes(tier))) {
            let fractalName = ach.name;
            ["Daily Tier 1 ", "Daily Tier 2 ", "Daily Tier 3 ", "Daily Tier 4 ", "Fractal"].forEach(term => {
              fractalName = fractalName.replace(term, "");
            });
            dailyFractals.add(fractalName.trim());
          }
        });

        const sortedRecommended = Array.from(recommendedFractals.entries())
          .sort(([scaleA], [scaleB]) => scaleA - scaleB)
          .map(([scale, name]) => ({ scale, name }));

        const sortedDailies = Array.from(dailyFractals).sort();

        setRecommended(sortedRecommended);
        setDailies(sortedDailies);
      } catch (err) {
        setError("Failed to fetch daily fractals. The API might be down.");
      } finally {
        setLoading(false);
      }
    };

    fetchFractals();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="text-muted-foreground text-center py-4">Loading fractals...</div>;
    }
    if (error) {
      return <div className="text-destructive text-center py-4">{error}</div>;
    }
    return (
      <div className="space-y-4">
        <div>
          <h4 className="flex items-center gap-2 text-md font-semibold text-foreground mb-2">
            <Award className="h-4 w-4" />
            Recommended
          </h4>
          <ul className="space-y-2 text-sm">
            {recommended.map(({ scale, name }) => (
              <li key={scale} className="flex items-center justify-between">
                <span className="text-muted-foreground">{name}</span>
                <Badge variant="secondary">{scale}</Badge>
              </li>
            ))}
          </ul>
        </div>
        <Separator />
        <div>
          <h4 className="flex items-center gap-2 text-md font-semibold text-foreground mb-2">
            <List className="h-4 w-4" />
            Daily Tiers
          </h4>
          <ul className="space-y-1.5 text-sm list-disc list-inside text-muted-foreground">
            {dailies.map(name => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col hover:shadow-xl transition-all duration-300">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-primary mb-4">
          Daily Fractals
        </h3>
        {renderContent()}
      </div>
    </div>
  );
};

export default FractalsCard;
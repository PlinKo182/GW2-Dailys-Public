import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Award, List, Gem } from 'lucide-react';
import useStore from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Data mapping from the user's script
const scaleToFractal = { 1:"Molten Furnace",2:"Uncategorized",3:"Snowblind",4:"Urban Battleground",5:"Swampland",6:"Cliffside",7:"Aquatic Ruins",8:"Underground Facility",9:"Molten Boss",10:"Molten Furnace",11:"Uncategorized",12:"Snowblind",13:"Urban Battleground",14:"Swampland",15:"Cliffside",16:"Aquatic Ruins",17:"Underground Facility",18:"Molten Boss",19:"Thaumanova Reactor",20:"Solid Ocean",21:"Uncategorized",22:"Snowblind",23:"Urban Battleground",24:"Swampland",25:"Cliffside",26:"Aquatic Ruins",27:"Underground Facility",28:"Molten Boss",29:"Thaumanova Reactor",30:"Solid Ocean",31:"Aetherblade",32:"Swampland",33:"Uncategorized",34:"Snowblind",35:"Urban Battleground",36:"Cliffside",37:"Aquatic Ruins",38:"Underground Facility",39:"Molten Boss",40:"Thaumanova Reactor",41:"Solid Ocean",42:"Aetherblade",43:"Captain Mai Trin Boss",44:"Chaos",45:"Nightmare",46:"Shattered Observatory",47:"Twilight Oasis",48:"Sunqua Peak",49:"Silent Surf",50:"Siren's Reef",51:"Deepstone",52:"Malicious Forgeman",53:"Molten Furnace",54:"Uncategorized",55:"Snowblind",56:"Urban Battleground",57:"Swampland",58:"Cliffside",59:"Aquatic Ruins",60:"Underground Facility",61:"Molten Boss",62:"Thaumanova Reactor",63:"Solid Ocean",64:"Aetherblade",65:"Underground Facility",66:"Captain Mai Trin Boss",67:"Chaos",68:"Nightmare",69:"Shattered Observatory",70:"Twilight Oasis",71:"Sunqua Peak",72:"Silent Surf",73:"Siren's Reef",74:"Deepstone",75:"Malicious Forgeman",76:"Molten Furnace",77:"Uncategorized",78:"Snowblind",79:"Urban Battleground",80:"Swampland",81:"Cliffside",82:"Aquatic Ruins",83:"Underground Facility",84:"Molten Boss",85:"Thaumanova Reactor",86:"Solid Ocean",87:"Aetherblade",88:"Captain Mai Trin Boss",89:"Chaos",90:"Nightmare",91:"Shattered Observatory",92:"Twilight Oasis",93:"Sunqua Peak",94:"Silent Surf",95:"Siren's Reef",96:"Deepstone",97:"Malicious Forgeman",98:"Uncategorized",99:"Snowblind",100:"Urban Battleground"};

const FractalsCard = () => {
  const { fractalTasks, setFractalTasks, handleTaskToggle, taskCompletion } = useStore(state => ({
    fractalTasks: state.fractalTasks,
    setFractalTasks: state.setFractalTasks,
    handleTaskToggle: state.handleTaskToggle,
    taskCompletion: state.userData.taskCompletion,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFractals = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch the list of today's daily achievements
        const dailyResponse = await axios.get("https://api.guildwars2.com/v2/achievements/daily");
        const fractalAchievementIds = dailyResponse.data.fractals.map(f => f.id);

        if (fractalAchievementIds.length === 0) {
          setFractalTasks({ recommended: [], dailies: [] });
          setLoading(false);
          return;
        }

        // Fetch the details for each of those achievements
        const achievementsResponse = await axios.get(`https://api.guildwars2.com/v2/achievements?ids=${fractalAchievementIds.join(',')}`);
        const achievements = achievementsResponse.data;

        const recommendedFractals = new Map();
        const dailyFractals = new Set();

        achievements.forEach(ach => {
          const scaleMatch = ach.name.match(/Scale (\d+)/);
          const scale = scaleMatch ? parseInt(scaleMatch[1], 10) : null;

          if (ach.name.includes("Recommended")) {
            if (scale) {
              const fractalName = scaleToFractal[scale] || `Scale ${scale}`;
              // For recommended, we store scale and name separately to keep the badge UI
              recommendedFractals.set(scale, fractalName);
            }
          } else if (["Tier 1", "Tier 2", "Tier 3", "Tier 4"].some(tier => ach.name.includes(tier))) {
            if (scale) {
              const fractalName = scaleToFractal[scale] || `Unknown Fractal`;
              // For daily tiers, we create the combined name string
              dailyFractals.add(`${scale} - ${fractalName}`);
            } else {
              // Fallback for generic dailies
              dailyFractals.add(ach.name);
            }
          }
        });

        // Generate stable IDs and update the global store
        // Recommended fractals keep their structure for the badge display
        const sortedRecommended = Array.from(recommendedFractals.entries())
          .sort(([scaleA], [scaleB]) => scaleA - scaleB)
          .map(([scale, name]) => ({ id: `fractal_rec_${scale}`, name, scale }));

        // Daily tiers have the pre-formatted name
        const sortedDailies = Array.from(dailyFractals).sort((a, b) => {
            const scaleA = parseInt(a.split(' ')[0], 10);
            const scaleB = parseInt(b.split(' ')[0], 10);

            if (isNaN(scaleA) && isNaN(scaleB)) return a.localeCompare(b);
            if (isNaN(scaleA)) return 1;
            if (isNaN(scaleB)) return -1;

            return scaleA - scaleB;
          }).map(name => ({ id: `fractal_daily_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, name }));

        setFractalTasks({
          recommended: sortedRecommended,
          dailies: sortedDailies,
        });
      } catch (err) {
        setError("Failed to fetch daily fractals. The API might be down.");
      } finally {
        setLoading(false);
      }
    };

    fetchFractals();
  }, [setFractalTasks]);

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
            {fractalTasks.recommended.map(({ id, name, scale }) => (
              <li key={id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox id={id} checked={taskCompletion[id]} onCheckedChange={() => handleTaskToggle(id)} />
                  <label htmlFor={id} className="text-muted-foreground cursor-pointer">{name}</label>
                </div>
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
          <ul className="space-y-2 text-sm">
            {fractalTasks.dailies.map(({ id, name }) => (
               <li key={id} className="flex items-center gap-2">
                  <Checkbox id={id} checked={taskCompletion[id]} onCheckedChange={() => handleTaskToggle(id)} />
                  <label htmlFor={id} className="text-muted-foreground cursor-pointer">{name}</label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const allFractalTaskIds = [
    ...(fractalTasks.recommended || []).map(t => t.id),
    ...(fractalTasks.dailies || []).map(t => t.id)
  ];

  const completedFractalTasks = allFractalTaskIds.filter(id => taskCompletion[id]);
  const areAllFractalsCompleted = completedFractalTasks.length === allFractalTaskIds.length && allFractalTaskIds.length > 0;

  const handleToggleAllFractals = () => {
    const newCompletionState = !areAllFractalsCompleted;
    allFractalTaskIds.forEach(id => {
      if (!!taskCompletion[id] !== newCompletionState) {
        handleTaskToggle(id, newCompletionState);
      }
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <CardTitle
                onClick={handleToggleAllFractals}
                className={`cursor-pointer hover:underline ${areAllFractalsCompleted ? 'line-through text-muted-foreground' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Gem className="h-5 w-5" />
                  Daily Fractals
                </div>
              </CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p>Click to toggle all tasks</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default FractalsCard;
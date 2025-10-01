import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Award, List, Gem, PencilIcon, TrashIcon } from 'lucide-react';
import useStore from '../store/useStore';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Data mapping from the user's script
const scaleToFractal = { 1:"Molten Furnace",2:"Uncategorized",3:"Snowblind",4:"Urban Battleground",5:"Swampland",6:"Cliffside",7:"Aquatic Ruins",8:"Underground Facility",9:"Molten Boss",10:"Molten Furnace",11:"Uncategorized",12:"Snowblind",13:"Urban Battleground",14:"Swampland",15:"Cliffside",16:"Aquatic Ruins",17:"Underground Facility",18:"Molten Boss",19:"Thaumanova Reactor",20:"Solid Ocean",21:"Uncategorized",22:"Snowblind",23:"Urban Battleground",24:"Swampland",25:"Cliffside",26:"Aquatic Ruins",27:"Underground Facility",28:"Molten Boss",29:"Thaumanova Reactor",30:"Solid Ocean",31:"Aetherblade",32:"Swampland",33:"Uncategorized",34:"Snowblind",35:"Urban Battleground",36:"Cliffside",37:"Aquatic Ruins",38:"Underground Facility",39:"Molten Boss",40:"Thaumanova Reactor",41:"Solid Ocean",42:"Aetherblade",43:"Captain Mai Trin Boss",44:"Chaos",45:"Nightmare",46:"Shattered Observatory",47:"Twilight Oasis",48:"Sunqua Peak",49:"Silent Surf",50:"Siren's Reef",51:"Deepstone",52:"Malicious Forgeman",53:"Molten Furnace",54:"Uncategorized",55:"Snowblind",56:"Urban Battleground",57:"Swampland",58:"Cliffside",59:"Aquatic Ruins",60:"Underground Facility",61:"Molten Boss",62:"Thaumanova Reactor",63:"Solid Ocean",64:"Aetherblade",65:"Underground Facility",66:"Captain Mai Trin Boss",67:"Chaos",68:"Nightmare",69:"Shattered Observatory",70:"Twilight Oasis",71:"Sunqua Peak",72:"Silent Surf",73:"Siren's Reef",74:"Deepstone",75:"Malicious Forgeman",76:"Molten Furnace",77:"Uncategorized",78:"Snowblind",79:"Urban Battleground",80:"Swampland",81:"Cliffside",82:"Aquatic Ruins",83:"Underground Facility",84:"Molten Boss",85:"Thaumanova Reactor",86:"Solid Ocean",87:"Aetherblade",88:"Captain Mai Trin Boss",89:"Chaos",90:"Nightmare",91:"Shattered Observatory",92:"Twilight Oasis",93:"Sunqua Peak",94:"Silent Surf",95:"Siren's Reef",96:"Deepstone",97:"Malicious Forgeman",98:"Uncategorized",99:"Snowblind",100:"Urban Battleground"};

const FractalsCard = ({ card, taskCompletion, onTaskToggle, isEditMode }) => {
  const { fractalTasks, setFractalTasks, updateCardTitle, deleteCard } = useStore(state => ({
    fractalTasks: state.fractalTasks,
    setFractalTasks: state.setFractalTasks,
    updateCardTitle: state.updateCardTitle,
    deleteCard: state.deleteCard,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);

  useEffect(() => {
    const fetchFractals = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch daily fractals from category 88
        const categoryResponse = await axios.get("https://api.guildwars2.com/v2/achievements/categories/88");
        
        if (!categoryResponse.data?.achievements) {
          setFractalTasks({ recommended: [], dailies: [] });
          setLoading(false);
          return;
        }

        // Fetch the details for each achievement in the category
        const achievementIds = categoryResponse.data.achievements;
        const achievementsResponse = await axios.get(`https://api.guildwars2.com/v2/achievements?ids=${achievementIds.join(',')}`);
        const achievements = achievementsResponse.data;

        const recommendedFractals = new Set();
        const dailyFractals = new Set();

        achievements.forEach(ach => {
          const name = ach.name;
          
          // Process recommended fractals
          if (name.includes("Recommended")) {
            try {
              const scale = parseInt(name.split("Scale ")[1], 10);
              const fractalName = scaleToFractal[scale] || `Scale ${scale}`;
              recommendedFractals.add([scale, fractalName]);
            } catch (e) {
              console.warn("Could not parse recommended fractal scale:", name);
            }
          } 
          // Process daily tier fractals
          else if (["Tier 1", "Tier 2", "Tier 3", "Tier 4"].some(tier => name.includes(tier))) {
            // Clean up the name by removing tier prefixes
            let fractalName = name;
            ["Daily Tier 1 ", "Daily Tier 2 ", "Daily Tier 3 ", "Daily Tier 4 ", "Fractal"].forEach(prefix => {
              fractalName = fractalName.replace(prefix, "");
            });
            dailyFractals.add(fractalName.trim());
          }
        });

        // Sort and format recommended fractals
        const sortedRecommended = Array.from(recommendedFractals)
          .sort(([scaleA], [scaleB]) => scaleA - scaleB)
          .map(([scale, name]) => ({
            id: `fractal_rec_${scale}`,
            name,
            scale
          }));

        // Sort and format daily fractals
        const sortedDailies = Array.from(dailyFractals)
          .sort()
          .map(name => ({
            id: `fractal_daily_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name
          }));

        setFractalTasks({
          recommended: sortedRecommended,
          dailies: sortedDailies,
        });
      } catch (err) {
        console.error("Error fetching daily fractals:", err);
        setError("Failed to fetch daily fractals. The API might be down or returned an unexpected response.");
      } finally {
        setLoading(false);
      }
    };

    fetchFractals();
  }, [setFractalTasks]);

  const allFractalTaskIds = [
    ...(fractalTasks.recommended || []).map(t => t.id),
    ...(fractalTasks.dailies || []).map(t => t.id)
  ];
  const completedCount = allFractalTaskIds.filter(id => taskCompletion[id]).length;
  const totalTasks = allFractalTaskIds.length;
  const areAllFractalsCompleted = totalTasks > 0 && completedCount === totalTasks;

  const handleToggleAllFractals = () => {
    if (isEditMode) return;
    const newCompletionState = !areAllFractalsCompleted;
    allFractalTaskIds.forEach(id => {
      if (!!taskCompletion[id] !== newCompletionState) {
        onTaskToggle(id);
      }
    });
  };

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    updateCardTitle(card.id, title);
  };
  const handleTitleKeyDown = (e) => e.key === 'Enter' && handleTitleBlur();

  const renderContent = () => {
    if (loading) return <div className="text-muted-foreground text-center py-4">Loading fractals...</div>;
    if (error) return <div className="text-destructive text-center py-4">{error}</div>;
    if (totalTasks === 0) return <div className="text-muted-foreground text-center py-4">No daily fractals found.</div>;

    return (
      <div className="space-y-3">
        <div>
          <h4 className="flex items-center gap-2 text-md font-semibold text-foreground mb-1">
            <Award className="h-4 w-4" />
            Recommended
          </h4>
          <div className="space-y-1 text-sm">
            {(fractalTasks.recommended || []).map(({ id, name, scale }) => {
                const isCompleted = taskCompletion[id] || false;
                return (
                  <div key={id} className="flex h-5 items-center space-x-3">
                    <Checkbox id={id} checked={isCompleted} onCheckedChange={() => onTaskToggle(id)} className="h-3.5 w-3.5" />
                    <div className="flex-1">
                      <label htmlFor={id} className={`cursor-pointer leading-none flex items-center gap-2 transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                        {scale} - {name}
                      </label>
                    </div>
                  </div>
                );
            })}
          </div>
        </div>
        <Separator />
        <div>
          <h4 className="flex items-center gap-2 text-md font-semibold text-foreground mb-1">
            <List className="h-4 w-4" />
            Daily Tiers
          </h4>
          <div className="space-y-1 text-sm">
            {(fractalTasks.dailies || []).map(({ id, name }) => {
                const isCompleted = taskCompletion[id] || false;
                return (
                   <div key={id} className="flex h-5 items-center space-x-3">
                      <Checkbox id={id} checked={isCompleted} onCheckedChange={() => onTaskToggle(id)} className="h-3.5 w-3.5" />
                      <div className="flex-1">
                        <label htmlFor={id} className={`cursor-pointer leading-none flex items-center gap-2 transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>{name}</label>
                      </div>
                   </div>
                );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div className="flex items-center">
            {isEditMode && isEditingTitle ? (
                <Input value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} autoFocus className="text-xl font-bold" />
            ) : (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <CardTitle
                                onClick={handleToggleAllFractals}
                                className={`cursor-pointer hover:underline ${areAllFractalsCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Gem className="h-5 w-5" />
                                    {card.title}
                                </div>
                            </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to toggle all tasks</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            {!isEditingTitle && totalTasks > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({completedCount}/{totalTasks})
                </span>
            )}
        </div>
        {isEditMode && (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingTitle(true)} title="Edit title"><PencilIcon className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCard(card.id)} title="Delete card"><TrashIcon className="h-4 w-4" /></Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="py-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default FractalsCard;
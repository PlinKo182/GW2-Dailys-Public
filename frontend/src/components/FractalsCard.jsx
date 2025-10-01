import React, { useState, useEffect } from 'react';
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
import { fetchDailyFractals } from '../utils/apiHelpers';

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
    const loadFractals = async () => {
      setLoading(true);
      setError(null);
      try {
        const fractalData = await fetchDailyFractals();
        setFractalTasks(fractalData);
      } catch (err) {
        console.error("Error fetching daily fractals:", err);
        setError("Failed to fetch daily fractals. The API might be down or returned an unexpected response.");
      } finally {
        setLoading(false);
      }
    };

    loadFractals();
  }, [setFractalTasks]);

  const renderContent = () => {
    if (loading) {
      return <div className="text-muted-foreground text-center py-4">Loading fractals...</div>;
    }
    if (error) {
      return <div className="text-destructive text-center py-4">{error}</div>;
    }
    return (
      <div className="space-y-3">
        <div>
          <h4 className="flex items-center gap-2 text-md font-semibold text-foreground mb-1">
            <Award className="h-4 w-4" />
            Recommended
          </h4>
          <div className="space-y-1 text-sm">
            {fractalTasks.recommended.map(({ id, name, scale }) => {
                const isCompleted = taskCompletion[id] || false;
                return (
                  <div key={id} className="flex h-5 items-center space-x-3">
                    <Checkbox id={id} checked={isCompleted} onCheckedChange={() => handleTaskToggle(id)} className="h-3.5 w-3.5" />
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
            {fractalTasks.dailies.map(({ id, name }) => {
                const isCompleted = taskCompletion[id] || false;
                return (
                   <div key={id} className="flex h-5 items-center space-x-3">
                      <Checkbox id={id} checked={isCompleted} onCheckedChange={() => handleTaskToggle(id)} className="h-3.5 w-3.5" />
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
      <CardContent className="py-2">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default FractalsCard;
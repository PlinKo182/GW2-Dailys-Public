import React, { useState, useCallback } from 'react';
import useStore from '../store/useStore';
import CustomTaskCard from './Tasks/CustomTaskCard';
import PactSupplyCard from './PactSupplyCard';
import FractalsCard from './FractalsCard';
import ChallengeModeCard from './ChallengeModeCard';
import { Button } from "@/components/ui/button";
import { PlusCircleIcon } from '@heroicons/react/24/outline';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Package, Gem, Swords } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const DailyTasks = ({ currentTime }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const customTasks = useStore((state) => state.customTasks);
  const addCard = useStore((state) => state.addCard);
  const handleTaskToggle = useStore((state) => state.handleTaskToggle);
  const taskCompletion = useStore((state) => state.userData.taskCompletion);
  const {
    showOfficialDailies, toggleOfficialDailies,
    showPactSupply, togglePactSupply,
    showFractals, toggleFractals,
    showChallengeModes, toggleChallengeModes
  } = useStore((state) => ({
    showOfficialDailies: state.showOfficialDailies,
    toggleOfficialDailies: state.toggleOfficialDailies,
    showPactSupply: state.showPactSupply,
    togglePactSupply: state.togglePactSupply,
    showFractals: state.showFractals,
    toggleFractals: state.toggleFractals,
    showChallengeModes: state.showChallengeModes,
    toggleChallengeModes: state.toggleChallengeModes,
  }));

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
  }, []);

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <Button onClick={() => setIsEditMode(!isEditMode)} variant="outline">
          {isEditMode ? 'Done Editing' : 'Edit Dailies'}
        </Button>
      </div>

      <Collapsible open={showOfficialDailies} onOpenChange={toggleOfficialDailies} className="mb-6 border-b pb-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-start px-2 text-lg font-semibold">
            <ChevronDown className={`h-5 w-5 mr-2 transition-transform ${showOfficialDailies ? 'rotate-180' : ''}`} />
            Official Dailies
            <span className="flex items-center gap-2 ml-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <Gem className="h-4 w-4" />
              <Swords className="h-4 w-4" />
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex items-center justify-end space-x-4 pt-4">
            <div className="flex items-center space-x-2">
              <Switch id="pact-supply-toggle" checked={showPactSupply} onCheckedChange={togglePactSupply} />
              <Label htmlFor="pact-supply-toggle">Pact Supply</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="fractals-toggle" checked={showFractals} onCheckedChange={toggleFractals} />
              <Label htmlFor="fractals-toggle">Fractals</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="cm-toggle" checked={showChallengeModes} onCheckedChange={toggleChallengeModes} />
              <Label htmlFor="cm-toggle">CMs</Label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
            {showPactSupply && <PactSupplyCard currentTime={currentTime} />}
            {showFractals && <FractalsCard />}
            {showChallengeModes && <ChallengeModeCard />}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {customTasks.map(card => (
          <CustomTaskCard
            key={card.id}
            card={card}
            taskCompletion={taskCompletion}
            onTaskToggle={handleTaskToggle}
            onCopyWaypoint={copyToClipboard}
            currentTime={currentTime}
            isEditMode={isEditMode}
          />
        ))}
      </div>
      {isEditMode && (
        <div className="mt-6 text-center">
          <Button onClick={() => addCard('New Daily Card')}><PlusCircleIcon className="h-5 w-5 mr-2" />Add New Card</Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(DailyTasks);
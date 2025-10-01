import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Copy, Package, PencilIcon, TrashIcon } from 'lucide-react';
import useStore from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Constants remain the same as they define the content of this specific card type
const PACT_AGENTS = ["Mehem the Traveled", "The Fox", "Specialist Yana", "Lady Derwena", "Despina Katelyn", "Verma Giftrender"];
const VENDORS = {
  "Mehem the Traveled":   {0: "[&BIcHAAA=]", 1: "[&BH8HAAA=]", 2: "[&BH4HAAA=]", 3: "[&BKsHAAA=]", 4: "[&BJQHAAA=]", 5: "[&BH8HAAA=]", 6: "[&BIkHAAA=]"},
  "The Fox":              {0: "[&BEwDAAA=]", 1: "[&BEgAAAA=]", 2: "[&BMIBAAA=]", 3: "[&BE8AAAA=]", 4: "[&BMMCAAA=]", 5: "[&BLkCAAA=]", 6: "[&BDoBAAA=]"},
  "Lady Derwena":         {0: "[&BKYBAAA=]", 1: "[&BBkAAAA=]", 2: "[&BKYAAAA=]", 3: "[&BIMAAAA=]", 4: "[&BNUGAAA=]", 5: "[&BJIBAAA=]", 6: "[&BC0AAAA=]"},
  "Specialist Yana":      {0: "[&BNIEAAA=]", 1: "[&BKgCAAA=]", 2: "[&BP0CAAA=]", 3: "[&BP0DAAA=]", 4: "[&BJsCAAA=]", 5: "[&BBEDAAA=]", 6: "[&BO4CAAA=]"},
  "Despina Katelyn":      {0: "[&BIMCAAA=]", 1: "[&BGQCAAA=]", 2: "[&BDgDAAA=]", 3: "[&BF0GAAA=]", 4: "[&BHsBAAA=]", 5: "[&BEICAAA=]", 6: "[&BIUCAAA=]"},
  "Verma Giftrender":     {0: "[&BA8CAAA=]", 1: "[&BIMBAAA=]", 2: "[&BPEBAAA=]", 3: "[&BOcBAAA=]", 4: "[&BNMAAAA=]", 5: "[&BBABAAA=]", 6: "[&BCECAAA=]"}
};

const getPsnaChatlinks = (now) => {
  const resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));
  let targetDate = now;
  if (now < resetTime) {
    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    targetDate = yesterday;
  }
  const vendorDayIndex = (targetDate.getUTCDay() + 6) % 7;
  const links = {};
  for (const npc of PACT_AGENTS) {
    links[npc] = VENDORS[npc][vendorDayIndex];
  }
  return links;
};

const PACT_AGENT_TASKS = PACT_AGENTS.map(agent => ({
  name: agent,
  id: `pact_supply_${agent.toLowerCase().replace(/ /g, '_')}`
}));
const PACT_AGENT_TASK_IDS = PACT_AGENT_TASKS.map(task => task.id);

const PactSupplyCard = ({ card, currentTime, taskCompletion, onTaskToggle, isEditMode }) => {
  const [dailyLinks, setDailyLinks] = useState({});
  const { setNotification, updateCardTitle, deleteCard } = useStore(state => ({
    setNotification: state.setNotification,
    updateCardTitle: state.updateCardTitle,
    deleteCard: state.deleteCard,
  }));
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);

  useEffect(() => {
    setDailyLinks(getPsnaChatlinks(currentTime));
  }, [currentTime]);

  const copyToClipboard = useCallback((text, isAll = false) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
    const message = isAll ? 'Copied all Pact Supply chatlinks!' : `Copied chatlink for ${text.split(' - ')[0]}!`;
    setNotification({ type: 'success', message });
    setTimeout(() => setNotification(null), 2000);
  }, [setNotification]);

  const handleCopyAll = () => {
    const allLinks = Object.entries(dailyLinks).map(([npc, chatlink]) => `${npc} - ${chatlink}`).join(' ');
    copyToClipboard(allLinks, true);
  };

  const completedCount = PACT_AGENT_TASK_IDS.filter(id => taskCompletion[id]).length;
  const totalTasks = PACT_AGENT_TASK_IDS.length;
  const isAllCompleted = completedCount === totalTasks;

  const handleToggleAll = () => {
    if (isEditMode) return;
    const newCompletionState = !isAllCompleted;
    PACT_AGENT_TASK_IDS.forEach(id => {
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
                    onClick={handleToggleAll}
                    className={`cursor-pointer hover:underline ${isAllCompleted ? 'line-through text-muted-foreground' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
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
          {!isEditingTitle && (
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
        <div className="space-y-1 text-sm">
          {PACT_AGENT_TASKS.map(task => {
            const chatlink = dailyLinks[task.name];
            const isCompleted = !!taskCompletion[task.id];
            return (
              <div key={task.id} className="flex h-5 items-center space-x-3">
                <Checkbox
                  id={task.id}
                  checked={isCompleted}
                  onCheckedChange={() => handleTaskToggle(task.id)}
                  className="h-3.5 w-3.5"
                />
                <div className="flex-1">
                  <label
                    htmlFor={task.id}
                    className={`cursor-pointer leading-none flex items-center gap-2 transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                  >
                    {task.name}
                  </label>
                </div>
                {chatlink && (
                  <button
                    onClick={() => copyToClipboard(`${task.name} - ${chatlink}`)}
                    aria-label={`Copy waypoint for ${task.name}`}
                    className="text-green-600 hover:underline text-sm font-mono transition-colors duration-150"
                    title="Click to copy chatlink"
                  >
                    {chatlink}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={handleCopyAll}>
            <Copy className="h-4 w-4 mr-2" />
            Copy All Chatlinks
        </Button>
      </CardContent>
    </Card>
  );
};

export default PactSupplyCard;
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Package } from 'lucide-react';
import useStore from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const PACT_AGENTS = ["Mehem", "Fox", "Yana", "Derwena", "Katelyn", "Verma"];
const VENDORS = {
  "Mehem":   {0: "[&BIcHAAA=]", 1: "[&BH8HAAA=]", 2: "[&BH4HAAA=]", 3: "[&BKsHAAA=]", 4: "[&BJQHAAA=]", 5: "[&BH8HAAA=]", 6: "[&BIkHAAA=]"},
  "Fox":     {0: "[&BEwDAAA=]", 1: "[&BEgAAAA=]", 2: "[&BMIBAAA=]", 3: "[&BE8AAAA=]", 4: "[&BMMCAAA=]", 5: "[&BLkCAAA=]", 6: "[&BDoBAAA=]"},
  "Derwena": {0: "[&BKYBAAA=]", 1: "[&BBkAAAA=]", 2: "[&BKYAAAA=]", 3: "[&BIMAAAA=]", 4: "[&BNUGAAA=]", 5: "[&BJIBAAA=]", 6: "[&BC0AAAA=]"},
  "Yana":    {0: "[&BNIEAAA=]", 1: "[&BKgCAAA=]", 2: "[&BP0CAAA=]", 3: "[&BP0DAAA=]", 4: "[&BJsCAAA=]", 5: "[&BBEDAAA=]", 6: "[&BO4CAAA=]"},
  "Katelyn": {0: "[&BIMCAAA=]", 1: "[&BGQCAAA=]", 2: "[&BDgDAAA=]", 3: "[&BF0GAAA=]", 4: "[&BHsBAAA=]", 5: "[&BEICAAA=]", 6: "[&BIUCAAA=]"},
  "Verma":   {0: "[&BA8CAAA=]", 1: "[&BIMBAAA=]", 2: "[&BPEBAAA=]", 3: "[&BOcBAAA=]", 4: "[&BNMAAAA=]", 5: "[&BBABAAA=]", 6: "[&BCECAAA=]"}
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
  id: `pact_supply_${agent.toLowerCase()}`
}));
const PACT_AGENT_TASK_IDS = PACT_AGENT_TASKS.map(task => task.id);

const PactSupplyCard = ({ currentTime }) => {
  const [dailyLinks, setDailyLinks] = useState({});
  const { setNotification, handleTaskToggle, taskCompletion } = useStore(state => ({
    setNotification: state.setNotification,
    handleTaskToggle: state.handleTaskToggle,
    taskCompletion: state.userData.taskCompletion,
  }));

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

  const completedNpcTasks = PACT_AGENT_TASK_IDS.filter(id => taskCompletion[id]);
  const isAllCompleted = completedNpcTasks.length === PACT_AGENT_TASK_IDS.length;
  const isSomeCompleted = completedNpcTasks.length > 0 && !isAllCompleted;

  const handleToggleAll = () => {
    const newCompletionState = !isAllCompleted;
    PACT_AGENT_TASK_IDS.forEach(id => {
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
                onClick={handleToggleAll}
                className={`cursor-pointer hover:underline ${isAllCompleted ? 'line-through text-muted-foreground' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Pact Supply Network Agent
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
        <div className="space-y-2 text-sm">
          {PACT_AGENT_TASKS.map(task => {
            const chatlink = dailyLinks[task.name];
            const isCompleted = !!taskCompletion[task.id];
            return (
              <div key={task.id} className="flex items-center space-x-3">
                <Checkbox
                  id={task.id}
                  checked={isCompleted}
                  onCheckedChange={() => handleTaskToggle(task.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={task.id}
                    className={`cursor-pointer transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
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
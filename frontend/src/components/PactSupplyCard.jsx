import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy } from 'lucide-react';
import useStore from '../store/useStore';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

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

const PACT_SUPPLY_TASK_ID = 'pact_supply_run';

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

  const isCompleted = taskCompletion[PACT_SUPPLY_TASK_ID] || false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Checkbox
            id={PACT_SUPPLY_TASK_ID}
            checked={isCompleted}
            onCheckedChange={() => handleTaskToggle(PACT_SUPPLY_TASK_ID)}
          />
          <label
            htmlFor={PACT_SUPPLY_TASK_ID}
            className={`text-xl font-bold text-primary cursor-pointer ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
          >
            Pact Supply Network Agent
          </label>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopyAll}
          title="Click to copy all chatlinks"
          className="h-8 w-8"
        >
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 pl-8">
          {Object.entries(dailyLinks).map(([npc, chatlink]) => (
            <div key={npc} className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{npc}</span>
              <span
                className="text-muted-foreground text-xs font-mono hover:bg-accent px-2 py-1 rounded transition-colors duration-150 cursor-pointer"
                onClick={() => copyToClipboard(`${npc} - ${chatlink}`)}
                title="Click to copy chatlink"
              >
                {chatlink}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PactSupplyCard;
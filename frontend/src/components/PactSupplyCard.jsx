import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import useStore from '../store/useStore';

// Data from the user request, converted to JS
const PACT_AGENTS = ["Mehem", "Fox", "Yana", "Derwena", "Katelyn", "Verma"];

const VENDORS = {
  "Mehem":   {0: "[&BIcHAAA=]", 1: "[&BH8HAAA=]", 2: "[&BH4HAAA=]", 3: "[&BKsHAAA=]", 4: "[&BJQHAAA=]", 5: "[&BH8HAAA=]", 6: "[&BIkHAAA=]"},
  "Fox":     {0: "[&BEwDAAA=]", 1: "[&BEgAAAA=]", 2: "[&BMIBAAA=]", 3: "[&BE8AAAA=]", 4: "[&BMMCAAA=]", 5: "[&BLkCAAA=]", 6: "[&BDoBAAA=]"},
  "Derwena": {0: "[&BKYBAAA=]", 1: "[&BBkAAAA=]", 2: "[&BKYAAAA=]", 3: "[&BIMAAAA=]", 4: "[&BNUGAAA=]", 5: "[&BJIBAAA=]", 6: "[&BC0AAAA=]"},
  "Yana":    {0: "[&BNIEAAA=]", 1: "[&BKgCAAA=]", 2: "[&BP0CAAA=]", 3: "[&BP0DAAA=]", 4: "[&BJsCAAA=]", 5: "[&BBEDAAA=]", 6: "[&BO4CAAA=]"},
  "Katelyn": {0: "[&BIMCAAA=]", 1: "[&BGQCAAA=]", 2: "[&BDgDAAA=]", 3: "[&BF0GAAA=]", 4: "[&BHsBAAA=]", 5: "[&BEICAAA=]", 6: "[&BIUCAAA=]"},
  "Verma":   {0: "[&BA8CAAA=]", 1: "[&BIMBAAA=]", 2: "[&BPEBAAA=]", 3: "[&BOcBAAA=]", 4: "[&BNMAAAA=]", 5: "[&BBABAAA=]", 6: "[&BCECAAA=]"}
};

/**
 * Determines the correct daily chatlinks for the Pact Supply Network Agents.
 * @param {Date} now - The current date and time.
 * @returns {Object} - An object mapping NPC names to their chatlinks for the current day.
 */
const getPsnaChatlinks = (now) => {
  // GW2 daily reset is at 08:00 UTC.
  const resetTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0, 0));

  let targetDate = now;
  // If the current time is before today's reset, we need to use yesterday's data.
  if (now < resetTime) {
    const yesterday = new Date(now);
    yesterday.setUTCDate(now.getUTCDate() - 1);
    targetDate = yesterday;
  }

  const jsDay = targetDate.getUTCDay(); // In JS, Sunday is 0, Monday is 1, etc.
  // The vendor data is indexed with Monday as 0. We convert the JS day to match.
  const vendorDayIndex = (jsDay + 6) % 7; // Converts to Monday = 0, ..., Sunday = 6

  const links = {};
  for (const npc of PACT_AGENTS) {
    links[npc] = VENDORS[npc][vendorDayIndex];
  }
  return links;
};

const PactSupplyCard = ({ currentTime }) => {
  const [dailyLinks, setDailyLinks] = useState({});
  const setNotification = useStore(state => state.setNotification);

  useEffect(() => {
    setDailyLinks(getPsnaChatlinks(currentTime));
  }, [currentTime]);

  const copyToClipboard = useCallback((text, npcName) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
    setNotification({ type: 'success', message: `Copied ${npcName}'s chatlink!` });
    setTimeout(() => setNotification(null), 2000);
  }, [setNotification]);

  return (
    <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col hover:shadow-xl transition-all duration-300">
      <div className="p-6 flex-grow">
        <h3 className="text-xl font-bold text-primary mb-4">Pact Supply Network</h3>
        <div className="space-y-3">
          {Object.entries(dailyLinks).map(([npc, chatlink]) => (
            <div key={npc} className="flex items-center justify-between">
              <span className="font-medium">{npc}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-muted-foreground">{chatlink}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(chatlink, npc)}
                  title={`Copy ${npc}'s chatlink`}
                >
                  <ClipboardDocumentIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PactSupplyCard;
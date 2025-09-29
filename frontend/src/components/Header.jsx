import React from 'react';
import { formatTimeWithSeconds } from '../utils/timeUtils';
import { ModeToggle } from "@/components/ui/ThemeSwitcher";
import { LogoutButton } from './ui/LogoutButton';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import useStore from '../store/useStore';

const Header = ({ currentTime, apiStatus, isOnline }) => {
  const { showPactSupplyCard, togglePactSupplyCard } = useStore(state => ({
    showPactSupplyCard: state.showPactSupplyCard,
    togglePactSupplyCard: state.togglePactSupplyCard,
  }));

  const getStatusDisplay = () => {
    if (!isOnline) {
      return { text: 'Offline', className: 'bg-destructive/20 text-destructive-foreground' };
    }
    switch (apiStatus) {
      case 'online':
        return { text: 'Online', className: 'bg-primary/20 text-primary' };
      case 'unavailable':
        return { text: 'API Unavailable', className: 'bg-secondary/20 text-secondary-foreground' };
      case 'checking':
        return { text: 'Checking...', className: 'bg-muted/20 text-muted-foreground' };
      default:
        return { text: 'Unknown', className: 'bg-muted/20 text-muted-foreground' };
    }
  };

  const status = getStatusDisplay();

  return (
    <header className="bg-card/95 border-b border-border sticky top-0 z-40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Guild Wars 2 Daily Tracker
            </h1>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${status.className}`}>
              {status.text}
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="pact-supply-toggle"
                checked={showPactSupplyCard}
                onCheckedChange={togglePactSupplyCard}
              />
              <Label htmlFor="pact-supply-toggle" className="text-sm">Pact Supply</Label>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Current Time</div>
              <div className="text-lg font-mono text-primary">
                {formatTimeWithSeconds(currentTime)}
              </div>
            </div>
            <ModeToggle />
            <LogoutButton />
          </div>
        </div>
      </div>
    </header>
  );
};

export default React.memo(Header);
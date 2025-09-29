import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

const TimerEditor = ({ task, timers, onSave, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localTimers, setLocalTimers] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Deep copy to prevent modifying parent state directly before saving
      setLocalTimers(JSON.parse(JSON.stringify(timers || [])));
    }
  }, [isOpen, timers]);

  const handleAddTime = () => {
    setLocalTimers([...localTimers, { times: [], duration: 10 }]);
  };

  const handleRemoveTimer = (index) => {
    setLocalTimers(localTimers.filter((_, i) => i !== index));
  };

  const handleTimeChange = (timerIndex, value) => {
    const newTimers = [...localTimers];
    newTimers[timerIndex].times = value.split(',').map(t => t.trim()).filter(Boolean);
    setLocalTimers(newTimers);
  };

  const handleDurationChange = (timerIndex, value) => {
    const newTimers = [...localTimers];
    newTimers[timerIndex].duration = parseInt(value, 10) || 0;
    setLocalTimers(newTimers);
  };

  const handleSave = () => {
    onSave(task.id, localTimers);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Timers for {task.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {localTimers.map((timer, timerIndex) => (
            <div key={timerIndex} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-grow space-y-2">
                <Input
                  type="text"
                  placeholder="HH:mm,HH:mm,..."
                  value={timer.times.join(',')}
                  onChange={(e) => handleTimeChange(timerIndex, e.target.value)}
                  className="font-mono"
                />
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={timer.duration}
                  onChange={(e) => handleDurationChange(timerIndex, e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleRemoveTimer(timerIndex)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddTime}>
            Add Timer
          </Button>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TimerEditor;
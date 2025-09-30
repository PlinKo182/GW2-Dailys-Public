import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { XIcon, PlusIcon } from 'lucide-react';

const TaskEditModal = ({ isOpen, onOpenChange, onSave, task }) => {
  const [name, setName] = useState('');
  const [waypoint, setWaypoint] = useState('');
  const [hasTimer, setHasTimer] = useState(false);
  const [availability, setAvailability] = useState({ times: ["00:00"], duration: 10 });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        setName(task.name || '');
        setWaypoint(task.waypoint || '');
        setHasTimer(task.hasTimer || false);
        if (task.hasTimer && task.availability) {
          setAvailability(task.availability);
        } else {
          setAvailability({ times: ["00:00"], duration: 10 });
        }
      } else {
        // Reset for new task
        setName('');
        setWaypoint('');
        setHasTimer(false);
        setAvailability({ times: ["00:00"], duration: 10 });
      }
    }
  }, [task, isOpen]);

  const handleSave = () => {
    onSave({
      name,
      waypoint,
      hasTimer,
      availability: hasTimer ? availability : null,
    });
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...availability.times];
    newTimes[index] = value;
    setAvailability({ ...availability, times: newTimes });
  };

  const addTimeInput = () => {
    setAvailability({ ...availability, times: [...availability.times, ""] });
  };

  const removeTimeInput = (index) => {
    const newTimes = availability.times.filter((_, i) => i !== index);
    setAvailability({ ...availability, times: newTimes });
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value, 10);
    setAvailability({ ...availability, duration: isNaN(newDuration) ? 0 : newDuration });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Name and Waypoint Inputs */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="waypoint" className="text-right">Waypoint</Label>
            <Input id="waypoint" value={waypoint} onChange={(e) => setWaypoint(e.target.value)} className="col-span-3" />
          </div>

          {/* Timer Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox id="hasTimer" checked={hasTimer} onCheckedChange={setHasTimer} />
            <Label htmlFor="hasTimer">Enable Timer</Label>
          </div>

          {/* Timer Configuration */}
          {hasTimer && (
            <div className="grid gap-4 pl-6 border-l-2 border-border ml-2">
              {/* Duration */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">Duration (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={availability.duration}
                  onChange={handleDurationChange}
                  className="col-span-2"
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Times (UTC)</Label>
                <div className="col-span-3 space-y-2">
                  {availability.times.map((time, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeTimeInput(index)} className="h-8 w-8">
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addTimeInput} className="mt-2">
                    <PlusIcon className="h-4 w-4 mr-2" /> Add Time
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditModal;
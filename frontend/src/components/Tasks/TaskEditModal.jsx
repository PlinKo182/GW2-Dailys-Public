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

const TaskEditModal = ({ isOpen, onOpenChange, onSave, task }) => {
  const [name, setName] = useState('');
  const [waypoint, setWaypoint] = useState('');
  const [hasTimer, setHasTimer] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name || '');
      setWaypoint(task.waypoint || '');
      setHasTimer(task.hasTimer || false);
    } else {
      // Reset for new task
      setName('');
      setWaypoint('');
      setHasTimer(false);
    }
  }, [task, isOpen]);

  const handleSave = () => {
    let finalAvailability = (task && task.availability) ? task.availability : null;
    if (hasTimer && !finalAvailability) {
      // If timer is enabled but no availability data exists, create a default.
      finalAvailability = { times: ["00:00"], duration: 10 };
    } else if (!hasTimer) {
      // If timer is disabled, ensure availability is null.
      finalAvailability = null;
    }
    onSave({ name, waypoint, hasTimer, availability: finalAvailability });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="waypoint" className="text-right">
              Waypoint
            </Label>
            <Input id="waypoint" value={waypoint} onChange={(e) => setWaypoint(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
             <Label htmlFor="hasTimer" className="text-right">
              Timer
            </Label>
            <Checkbox id="hasTimer" checked={hasTimer} onCheckedChange={setHasTimer} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskEditModal;
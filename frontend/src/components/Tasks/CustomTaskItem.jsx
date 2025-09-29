import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon, LinkIcon } from '@heroicons/react/24/outline';
import TaskTimer from './TaskTimer';

const CustomTaskItem = ({ task, isCompleted, onToggle, onUpdate, onDelete, onCopyWaypoint, currentTime, isEditMode }) => {
  return (
    <div className="flex items-center space-x-3">
      <Checkbox
        id={`task-${task.id}`}
        checked={isCompleted}
        onCheckedChange={onToggle}
      />
      <div className="flex-1">
        <label
          htmlFor={`task-${task.id}`}
          className={`text-foreground cursor-pointer transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
        >
          {task.name}
          {task.hasTimer && task.availability && (
            <TaskTimer
              availability={task.availability}
              currentTime={currentTime}
              inline
            />
          )}
        </label>
      </div>
      {task.waypoint && (
        <button
          onClick={() => onCopyWaypoint(task.waypoint)}
          aria-label={`Copy waypoint for ${task.name}`}
          className="text-primary text-xs font-mono hover:bg-muted px-2 py-1 rounded transition-colors duration-150"
          title="Click to copy waypoint"
        >
          {task.waypoint}
        </button>
      )}
      {isEditMode && (
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onUpdate(task)}
            title="Edit task"
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive"
            onClick={() => onDelete(task.id)}
            title="Delete task"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CustomTaskItem;
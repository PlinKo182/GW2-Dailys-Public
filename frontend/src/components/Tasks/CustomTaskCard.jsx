import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import TaskTimer from "./TaskTimer";

const CustomTaskCard = ({ card, taskCompletion, onTaskToggle, onCopyWaypoint, currentTime, isEditMode }) => {
  if (!card || !card.tasks) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {card.tasks.map(task => {
            const isCompleted = !!taskCompletion[task.id];
            return (
              <div key={task.id} className="flex min-h-[1.25rem] items-center space-x-3">
                <Checkbox
                  id={task.id}
                  checked={isCompleted}
                  onCheckedChange={() => onTaskToggle(task.id)}
                  className="h-4 w-4"
                />
                <div className="flex-1">
                  <label
                    htmlFor={task.id}
                    className={`cursor-pointer leading-none flex items-center gap-2 transition-colors ${isCompleted ? "line-through text-muted-foreground" : ""}`}
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
                    className="text-green-600 hover:underline text-sm font-mono transition-colors duration-150"
                    title="Click to copy waypoint"
                  >
                    {task.waypoint}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomTaskCard;

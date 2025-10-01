import React from 'react';
import CustomTaskItem from './CustomTaskItem';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const CustomTaskCard = ({ card, taskCompletion, onTaskToggle, onCopyWaypoint, currentTime, isEditMode }) => {
  // A guard against undefined card or tasks, which can happen during state transitions.
  if (!card || !card.tasks) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{card.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm pl-2">
          {card.tasks.map(task => (
            <li key={task.id}>
              <CustomTaskItem
                task={task}
                isCompleted={taskCompletion[task.id] || false}
                onToggle={() => onTaskToggle(task.id)}
                onCopyWaypoint={onCopyWaypoint}
                currentTime={currentTime}
                isEditMode={isEditMode}
              />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default CustomTaskCard;
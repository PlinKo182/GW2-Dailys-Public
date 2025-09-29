// components/DailyTasks.jsx
import React, { useCallback } from 'react';
import { ArchiveBoxIcon, WrenchScrewdriverIcon, StarIcon } from '@heroicons/react/24/solid';
import TaskTimer from './Tasks/TaskTimer';
import TimerEditor from './Tasks/TimerEditor';
import { Pencil } from 'lucide-react';
import { Button } from './ui/button';

const ProgressBar = React.memo(({ progress }) => (
  <div className="px-6 pb-4">
    <div className="flex justify-between items-center mb-1 text-sm font-medium">
      <span className="text-muted-foreground">Progress</span>
      <span className="text-primary">{progress.completed}/{progress.total}</span>
    </div>
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <div 
        className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${progress.percentage}%` }}
      />
    </div>
  </div>
));

const TaskCard = React.memo(({
  title,
  icon: Icon,
  description,
  tasks,
  category,
  progress,
  dailyTasks,
  onTaskToggle,
  copyToClipboard,
  currentTime,
  onTimersChange
}) => (
  <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col hover:shadow-xl transition-all duration-300 hover:-translate-y-1 transform-gpu">
    <div className="p-6 flex-grow">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-bold text-primary">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="group">
            <label htmlFor={`task-${category}-${task.id}`} className="flex items-center space-x-3 cursor-pointer">
              <input
                id={`task-${category}-${task.id}`}
                type="checkbox"
                checked={dailyTasks[category]?.[task.id] || false}
                onChange={() => onTaskToggle(category, task.id)}
                className="rounded bg-muted border-border text-primary focus:ring-ring/50 focus:ring-2"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-foreground transition-colors ${dailyTasks[category]?.[task.id] ? 'line-through text-muted-foreground' : ''}`}>
                    {task.name}
                    {task.availability && (
                      <TaskTimer 
                        availability={task.availability} 
                        currentTime={currentTime}
                        inline
                      />
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {task.waypoint && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          copyToClipboard(task.waypoint);
                        }}
                        aria-label={`Copy waypoint for ${task.name}`}
                        className="text-primary text-xs font-mono hover:bg-muted px-2 py-1 rounded transition-colors duration-150"
                        title="Click to copy waypoint"
                      >
                        {task.waypoint}
                      </button>
                    )}
                    {task.availability !== undefined && onTimersChange && (
                      <TimerEditor
                        task={task}
                        timers={task.availability}
                        onSave={onTimersChange}
                      >
                        <Button variant="ghost" size="icon" className="h-6 w-6" title="Edit Timers" onClick={(e) => e.stopPropagation()}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TimerEditor>
                    )}
                  </div>
                </div>
              </div>
            </label>
          </div>
        ))}
      </div>
    </div>
    <ProgressBar progress={progress} />
  </div>
));

const DailyTasks = ({ tasks, dailyTasks, onTaskToggle, calculateCategoryProgress, currentTime, onTimersChange }) => {
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text.trim()).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = text.trim();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <TaskCard
        title="Daily Gathering"
        icon={ArchiveBoxIcon}
        description="Visit these waypoints for daily gathering"
        tasks={tasks.gatheringTasks || []}
        category="gathering"
        progress={calculateCategoryProgress('gathering')}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        copyToClipboard={copyToClipboard}
        currentTime={currentTime}
        onTimersChange={onTimersChange}
      />
      
      <TaskCard
        title="Daily Crafting"
        icon={WrenchScrewdriverIcon}
        description="Craft these items daily"
        tasks={tasks.craftingTasks || []}
        category="crafting"
        progress={calculateCategoryProgress('crafting')}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        copyToClipboard={copyToClipboard}
        currentTime={currentTime}
        onTimersChange={onTimersChange}
      />
      
      <TaskCard
        title="Daily Specials"
        icon={StarIcon}
        description="PSNA and Home Instance tasks"
        tasks={tasks.specialTasks || []}
        category="specials"
        progress={calculateCategoryProgress('specials')}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        copyToClipboard={copyToClipboard}
        currentTime={currentTime}
        onTimersChange={onTimersChange}
      />
    </div>
  );
};

export default React.memo(DailyTasks);
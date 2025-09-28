// components/DailyTasks.jsx
import React, { useCallback } from 'react';
import { ArchiveBoxIcon, WrenchScrewdriverIcon, StarIcon } from '@heroicons/react/24/solid';
import { tasksData } from '../utils/tasksData';
import TaskTimer from './Tasks/TaskTimer';

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
  currentTime
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
                    {/* Timer inline, só mostra se não disponível */}
                    {task.availability && (
                      <TaskTimer 
                        availability={task.availability} 
                        currentTime={currentTime}
                        inline
                      />
                    )}
                  </span>
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

const DailyTasks = ({ dailyTasks, onTaskToggle, calculateCategoryProgress, currentTime }) => {
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
        tasks={tasksData.gatheringTasks}
        category="gathering"
        progress={calculateCategoryProgress('gathering')}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        copyToClipboard={copyToClipboard}
        currentTime={currentTime}
      />
      
      <TaskCard
        title="Daily Crafting"
        icon={WrenchScrewdriverIcon}
        description="Craft these items daily"
        tasks={tasksData.craftingTasks}
        category="crafting"
        progress={calculateCategoryProgress('crafting')}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        copyToClipboard={copyToClipboard}
        currentTime={currentTime}
      />
      
      <TaskCard
        title="Daily Specials"
        icon={StarIcon}
        description="PSNA and Home Instance tasks"
        tasks={tasksData.specialTasks}
        category="specials"
        progress={calculateCategoryProgress('specials')}
        dailyTasks={dailyTasks}
        onTaskToggle={onTaskToggle}
        copyToClipboard={copyToClipboard}
        currentTime={currentTime}
      />
    </div>
  );
};

export default React.memo(DailyTasks);
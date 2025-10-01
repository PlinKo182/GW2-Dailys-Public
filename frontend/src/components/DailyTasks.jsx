import React, { useState, useCallback } from 'react';
import useStore from '../store/useStore';
import CustomTaskItem from './Tasks/CustomTaskItem';
import TaskEditModal from './Tasks/TaskEditModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CustomTaskCard = ({ card, taskCompletion, onTaskToggle, onCopyWaypoint, currentTime, isEditMode }) => {
  const { addTask, updateTask, deleteTask, updateCardTitle, deleteCard } = useStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const taskIds = card.tasks.map(t => t.id);
  const completedTasks = taskIds.filter(id => taskCompletion[id]);
  const areAllTasksCompleted = taskIds.length > 0 && completedTasks.length === taskIds.length;

  const handleToggleAllTasks = () => {
    if (isEditMode) return;
    const newCompletionState = !areAllTasksCompleted;
    taskIds.forEach(id => {
      if (!!taskCompletion[id] !== newCompletionState) {
        onTaskToggle(id, newCompletionState);
      }
    });
  };

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    updateCardTitle(card.id, title);
  };
  const handleTitleKeyDown = (e) => e.key === 'Enter' && handleTitleBlur();
  const handleOpenModal = (task = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  const handleSaveTask = (taskData) => {
    if (editingTask) {
      updateTask(card.id, editingTask.id, taskData);
    } else {
      addTask(card.id, taskData.name);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        {isEditMode && isEditingTitle ? (
          <Input value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} autoFocus className="text-xl font-bold"/>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <CardTitle
                  onClick={handleToggleAllTasks}
                  className={`${!isEditMode ? 'cursor-pointer hover:underline' : ''} ${areAllTasksCompleted ? 'line-through text-muted-foreground' : ''}`}
                >
                  {card.title}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>Click to toggle all tasks</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {isEditMode && (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingTitle(true)} title="Edit title"><PencilIcon className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCard(card.id)} title="Delete card"><TrashIcon className="h-4 w-4" /></Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-1">
          {card.tasks.map(task => (
            <CustomTaskItem
              key={task.id}
              task={task}
              isCompleted={taskCompletion[task.id] || false}
              onToggle={() => onTaskToggle(task.id)}
              onUpdate={() => handleOpenModal(task)}
              onDelete={() => deleteTask(card.id, task.id)}
              onCopyWaypoint={onCopyWaypoint}
              currentTime={currentTime}
              isEditMode={isEditMode}
            />
          ))}
        </div>
        {isEditMode && (
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => handleOpenModal()}><PlusCircleIcon className="h-4 w-4 mr-2" />Add Task</Button>
        )}
      </CardContent>
      <TaskEditModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSaveTask} task={editingTask} />
    </Card>
  );
};

import PactSupplyCard from './PactSupplyCard';
import FractalsCard from './FractalsCard';
import ChallengeModeCard from './ChallengeModeCard';
import StrikesCard from './StrikesCard';
import { Package } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const DailyTasks = ({ currentTime }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const customTasks = useStore((state) => state.customTasks);
  const addCard = useStore((state) => state.addCard);
  const handleTaskToggle = useStore((state) => state.handleTaskToggle);
  const taskCompletion = useStore((state) => state.userData.taskCompletion);
  const {
    showPactSupply, togglePactSupply,
    showFractals, toggleFractals,
    showChallengeModes, toggleChallengeModes,
    showDailyStrikes, toggleDailyStrikes
  } = useStore((state) => ({
    showPactSupply: state.showPactSupply,
    togglePactSupply: state.togglePactSupply,
    showFractals: state.showFractals,
    toggleFractals: state.toggleFractals,
    showChallengeModes: state.showChallengeModes,
    toggleChallengeModes: state.toggleChallengeModes,
    showDailyStrikes: state.showDailyStrikes,
    toggleDailyStrikes: state.toggleDailyStrikes,
  }));

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
  }, []);

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <Button onClick={() => setIsEditMode(!isEditMode)} variant="outline">
          {isEditMode ? 'Done Editing' : 'Edit Dailies'}
        </Button>
      </div>

      {/* Compact Official Dailies Toggle Bar */}
      <div className="mb-6 border border-border rounded-lg p-4 bg-card/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Package className="h-4 w-4" />
            Official Dailies:
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="pact-supply-toggle" size="sm" checked={showPactSupply} onCheckedChange={togglePactSupply} />
              <Label htmlFor="pact-supply-toggle" className="text-sm">Pact Supply</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="fractals-toggle" size="sm" checked={showFractals} onCheckedChange={toggleFractals} />
              <Label htmlFor="fractals-toggle" className="text-sm">Fractals</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="cm-toggle" size="sm" checked={showChallengeModes} onCheckedChange={toggleChallengeModes} />
              <Label htmlFor="cm-toggle" className="text-sm">CMs</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="strikes-toggle" size="sm" checked={showDailyStrikes} onCheckedChange={toggleDailyStrikes} />
              <Label htmlFor="strikes-toggle" className="text-sm">Strikes</Label>
            </div>
          </div>
        </div>
        
        {/* Official Dailies Cards - Only show if any are enabled */}
        {(showPactSupply || showFractals || showChallengeModes || showDailyStrikes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-4 pt-4 border-t border-border">
            {showPactSupply && <PactSupplyCard currentTime={currentTime} />}
            {showFractals && <FractalsCard />}
            {showChallengeModes && <ChallengeModeCard />}
            {showDailyStrikes && <StrikesCard />}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Render all the user's custom task cards */}
        {customTasks.map(card => (
          <CustomTaskCard
            key={card.id}
            card={card}
            taskCompletion={taskCompletion}
            onTaskToggle={handleTaskToggle}
            onCopyWaypoint={copyToClipboard}
            currentTime={currentTime}
            isEditMode={isEditMode}
          />
        ))}
      </div>
      {isEditMode && (
        <div className="mt-6 text-center">
          <Button onClick={() => addCard('New Daily Card')}><PlusCircleIcon className="h-5 w-5 mr-2" />Add New Card</Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(DailyTasks);
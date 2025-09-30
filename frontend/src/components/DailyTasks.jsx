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
      <CardContent>
        <div className="space-y-4">
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from 'lucide-react';

const DailyTasks = ({ currentTime }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const customTasks = useStore((state) => state.customTasks);
  const addCard = useStore((state) => state.addCard);
  const handleTaskToggle = useStore((state) => state.handleTaskToggle);
  const taskCompletion = useStore((state) => state.userData.taskCompletion);
  const { showOfficialDailies, toggleOfficialDailies } = useStore((state) => ({
    showOfficialDailies: state.showOfficialDailies,
    toggleOfficialDailies: state.toggleOfficialDailies,
  }));

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Collapsible open={showOfficialDailies} onOpenChange={toggleOfficialDailies}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost">
              <ChevronDown className={`h-4 w-4 transition-transform ${showOfficialDailies ? 'rotate-180' : ''}`} />
              <span className="ml-2">Official Dailies</span>
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <Button onClick={() => setIsEditMode(!isEditMode)} variant="outline">
          {isEditMode ? 'Done Editing' : 'Edit Dailies'}
        </Button>
      </div>

      <CollapsibleContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
          <PactSupplyCard currentTime={currentTime} />
          <FractalsCard />
        </div>
        <hr className="border-border my-6" />
      </CollapsibleContent>

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
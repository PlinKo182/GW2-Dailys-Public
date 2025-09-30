import React, { useState, useCallback } from 'react';
import useStore from '../store/useStore';
import CustomTaskItem from './Tasks/CustomTaskItem';
import TaskEditModal from './Tasks/TaskEditModal';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircleIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

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

const CustomTaskCard = ({ card, taskCompletion, onTaskToggle, onCopyWaypoint, currentTime, isEditMode }) => {
  const { addTask, updateTask, deleteTask, updateCardTitle, deleteCard } = useStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const cardProgress = useCallback(() => {
    const totalTasks = card.tasks.length;
    if (totalTasks === 0) return { completed: 0, total: 0, percentage: 0 };
    const completedTasks = card.tasks.filter(task => taskCompletion[task.id]).length;
    return {
      completed: completedTasks,
      total: totalTasks,
      percentage: Math.round((completedTasks / totalTasks) * 100),
    };
  }, [card.tasks, taskCompletion]);

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
    <div className="bg-card rounded-xl overflow-hidden shadow-lg border border-border flex flex-col hover:shadow-xl transition-all duration-300">
      <div className="p-6 flex-grow">
        <div className="flex items-center justify-between mb-4">
          {isEditMode && isEditingTitle ? (
            <Input value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} autoFocus className="text-xl font-bold"/>
          ) : (
            <h3 className="text-xl font-bold text-primary">{card.title}</h3>
          )}
          {isEditMode && (
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingTitle(true)} title="Edit title"><PencilIcon className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCard(card.id)} title="Delete card"><TrashIcon className="h-4 w-4" /></Button>
            </div>
          )}
        </div>
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
      </div>
      <ProgressBar progress={cardProgress()} />
      <TaskEditModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} onSave={handleSaveTask} task={editingTask} />
    </div>
  );
};

import PactSupplyCard from './PactSupplyCard';
import FractalsCard from './FractalsCard'; // Import the new placeholder card
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const DailyTasks = ({ currentTime }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const customTasks = useStore((state) => state.customTasks);
  const addCard = useStore((state) => state.addCard);
  const handleTaskToggle = useStore((state) => state.handleTaskToggle);
  const taskCompletion = useStore((state) => state.userData.taskCompletion);
  const {
    showPactSupplyCard,
    togglePactSupplyCard,
    showFractalsCard,
    toggleFractalsCard
  } = useStore((state) => ({
    showPactSupplyCard: state.showPactSupplyCard,
    togglePactSupplyCard: state.togglePactSupplyCard,
    showFractalsCard: state.showFractalsCard,
    toggleFractalsCard: state.toggleFractalsCard,
  }));

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
  }, []);

  return (
    <div>
      <div className="flex justify-end items-center gap-6 mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="fractals-toggle"
            checked={showFractalsCard}
            onCheckedChange={toggleFractalsCard}
          />
          <Label htmlFor="fractals-toggle" className="text-sm">Fractals</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="pact-supply-toggle"
            checked={showPactSupplyCard}
            onCheckedChange={togglePactSupplyCard}
          />
          <Label htmlFor="pact-supply-toggle" className="text-sm">Pact Supply</Label>
        </div>
        <Button onClick={() => setIsEditMode(!isEditMode)} variant="outline">
          {isEditMode ? 'Done Editing' : 'Edit Dailies'}
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Conditionally render the special cards first */}
        {showPactSupplyCard && <PactSupplyCard currentTime={currentTime} />}
        {showFractalsCard && <FractalsCard />}

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
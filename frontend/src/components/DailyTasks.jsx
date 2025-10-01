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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const CustomTaskCard = ({ card, taskCompletion, onTaskToggle, onCopyWaypoint, currentTime, isEditMode }) => {
  const { addTask, updateTask, deleteTask, updateCardTitle, deleteCard } = useStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Safely access tasks, defaulting to an empty array if undefined
  const tasks = card.tasks || [];
  const taskIds = tasks.map(t => t.id);
  const completedCount = taskIds.filter(id => taskCompletion[id]).length;
  const totalTasks = taskIds.length;
  const areAllTasksCompleted = totalTasks > 0 && completedCount === totalTasks;

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
        <div className="flex items-center">
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
          {totalTasks > 0 && !isEditingTitle && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({completedCount}/{totalTasks})
            </span>
          )}
        </div>
        {isEditMode && (
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditingTitle(true)} title="Edit title"><PencilIcon className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCard(card.id)} title="Delete card"><TrashIcon className="h-4 w-4" /></Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-1">
          {tasks.map(task => (
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
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SortableCard = ({ card, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};


const DailyTasks = ({ currentTime }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const { cards, addCard, moveCard, handleTaskToggle, userData } = useStore(state => ({
    cards: state.cards,
    addCard: state.addCard,
    moveCard: state.moveCard,
    handleTaskToggle: state.handleTaskToggle,
    userData: state.userData,
  }));
  const taskCompletion = userData.taskCompletion;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = cards.findIndex(c => c.id === active.id);
      const newIndex = cards.findIndex(c => c.id === over.id);
      moveCard(oldIndex, newIndex);
    }
  };

  const copyToClipboard = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text.trim());
  }, []);

  // Map card types to their components for dynamic rendering
  const cardComponentMap = {
    custom: CustomTaskCard,
    pact_supply: PactSupplyCard,
    fractals: FractalsCard,
    cms: ChallengeModeCard,
    strikes: StrikesCard,
  };

  return (
    <div>
      <div className="flex justify-end items-center mb-4">
        <Button onClick={() => setIsEditMode(!isEditMode)} variant="outline">
          {isEditMode ? 'Done Editing' : 'Edit Dailies'}
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={cards.map(c => c.id)} strategy={() => {}}>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {cards.map(card => {
              const CardComponent = cardComponentMap[card.type];
              if (!CardComponent) return null;

              return (
                <SortableCard key={card.id} card={card}>
                  <CardComponent
                    card={card}
                    taskCompletion={taskCompletion}
                    onTaskToggle={handleTaskToggle}
                    onCopyWaypoint={copyToClipboard}
                    currentTime={currentTime}
                    isEditMode={isEditMode}
                  />
                </SortableCard>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {isEditMode && (
        <div className="mt-6 flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button><PlusCircleIcon className="h-5 w-5 mr-2" />Add Card</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Official Dailies</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => addCard('pact_supply')}>Pact Supply Network</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addCard('fractals')}>Daily Fractals</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addCard('strikes')}>Daily Strikes</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => addCard('cms')}>Fractal CMs</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Custom</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => addCard('custom')}>New Custom Card</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};

export default React.memo(DailyTasks);
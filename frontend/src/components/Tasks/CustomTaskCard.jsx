import React, { useState, useCallback } from 'react';
import useStore from '../../store/useStore';
import CustomTaskItem from './CustomTaskItem';
import TaskEditModal from './TaskEditModal';
import SectionEditModal from './SectionEditModal';
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
import { Separator } from '@/components/ui/separator';

const CustomTaskCard = ({ card, taskCompletion, onTaskToggle, onCopyWaypoint, currentTime, isEditMode }) => {
  const { addTask, updateTask, deleteTask, updateCardTitle, deleteCard, addSection, updateSectionTitle, deleteSection } = useStore();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(card.title);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  const allTasks = card.sections.flatMap(s => s.tasks);
  const taskIds = allTasks.map(t => t.id);
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

  const handleOpenTaskModal = (task = null, sectionId) => {
    setEditingTask(task ? { ...task, sectionId } : { sectionId });
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (taskData) => {
    if (editingTask && editingTask.id) {
      updateTask(card.id, editingTask.sectionId, editingTask.id, taskData);
    } else {
      addTask(card.id, editingTask.sectionId, taskData);
    }
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleOpenSectionModal = (section = null) => {
    setEditingSection(section);
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = (sectionTitle) => {
    if (editingSection) {
      updateSectionTitle(card.id, editingSection.id, sectionTitle);
    } else {
      addSection(card.id, sectionTitle);
    }
    setIsSectionModalOpen(false);
    setEditingSection(null);
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
          {card.sections.map((section, index) => (
            <div key={section.id}>
              {(card.sections.length > 1 || isEditMode) && (
                <div className="flex items-center justify-between mb-2">
                  <h4 className="flex items-center gap-2 text-md font-semibold text-foreground">
                    {section.title}
                  </h4>
                  {isEditMode && (
                     <div className="flex items-center">
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleOpenSectionModal(section)} title="Edit section title">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteSection(card.id, section.id)} title="Delete section">
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <ul className="space-y-2">
                {section.tasks.map(task => (
                  <CustomTaskItem
                    key={task.id}
                    task={task}
                    isCompleted={taskCompletion[task.id] || false}
                    onToggle={() => onTaskToggle(task.id)}
                    onUpdate={() => handleOpenTaskModal(task, section.id)}
                    onDelete={() => deleteTask(card.id, section.id, task.id)}
                    onCopyWaypoint={onCopyWaypoint}
                    currentTime={currentTime}
                    isEditMode={isEditMode}
                  />
                ))}
              </ul>
              {isEditMode && (
                <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => handleOpenTaskModal(null, section.id)}>
                  <PlusCircleIcon className="h-4 w-4 mr-2" />Add Task
                </Button>
              )}
              {index < card.sections.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </div>
        {isEditMode && (
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => handleOpenSectionModal(null)}>
            <PlusCircleIcon className="h-5 w-5 mr-2" />Add Division
          </Button>
        )}
      </CardContent>
      <TaskEditModal isOpen={isTaskModalOpen} onOpenChange={setIsTaskModalOpen} onSave={handleSaveTask} task={editingTask} />
      <SectionEditModal isOpen={isSectionModalOpen} onOpenChange={setIsSectionModalOpen} onSave={handleSaveSection} section={editingSection} />
    </Card>
  );
};

export default CustomTaskCard;
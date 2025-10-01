import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, PencilIcon, TrashIcon } from 'lucide-react';
import useStore from '../store/useStore';
import { fetchDailyStrikes } from '../utils/apiHelpers';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const StrikesCard = ({ card, taskCompletion, onTaskToggle, isEditMode }) => {
    const { strikesTasks, setStrikesTasks, updateCardTitle, deleteCard } = useStore(state => ({
        strikesTasks: state.strikesTasks,
        setStrikesTasks: state.setStrikesTasks,
        updateCardTitle: state.updateCardTitle,
        deleteCard: state.deleteCard,
    }));
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(card.title);

    useEffect(() => {
        const loadStrikes = async () => {
            // Only fetch if tasks aren't already loaded
            if (strikesTasks.length === 0) {
                try {
                    const strikes = await fetchDailyStrikes();
                    setStrikesTasks(strikes);
                } catch (error) {
                    console.error("Error loading daily strikes:", error);
                }
            }
        };
        loadStrikes();
    }, [setStrikesTasks, strikesTasks]);

    const strikeTaskIds = (strikesTasks || []).map(t => t.id);
    const completedCount = strikeTaskIds.filter(id => taskCompletion[id]).length;
    const totalTasks = strikeTaskIds.length;
    const areAllStrikesCompleted = totalTasks > 0 && completedCount === totalTasks;

    const handleToggleAllStrikes = () => {
        if (isEditMode) return;
        const newCompletionState = !areAllStrikesCompleted;
        strikeTaskIds.forEach(id => {
            if (!!taskCompletion[id] !== newCompletionState) {
                onTaskToggle(id);
            }
        });
    };

    const handleTitleChange = (e) => setTitle(e.target.value);
    const handleTitleBlur = () => {
        setIsEditingTitle(false);
        updateCardTitle(card.id, title);
    };
    const handleTitleKeyDown = (e) => e.key === 'Enter' && handleTitleBlur();

    if (!strikesTasks?.length) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Loading daily strikes...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div className="flex items-center">
                    {isEditMode && isEditingTitle ? (
                        <Input value={title} onChange={handleTitleChange} onBlur={handleTitleBlur} onKeyDown={handleTitleKeyDown} autoFocus className="text-xl font-bold" />
                    ) : (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <CardTitle
                                        onClick={handleToggleAllStrikes}
                                        className={`cursor-pointer hover:underline ${areAllStrikesCompleted ? 'line-through text-muted-foreground' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Swords className="h-5 w-5" />
                                            {card.title}
                                        </div>
                                    </CardTitle>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Click to toggle all tasks</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    {!isEditingTitle && totalTasks > 0 && (
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
                <div className="space-y-1 text-sm">
                    {strikesTasks.map(({ id, name }) => {
                        const isCompleted = taskCompletion[id] || false;
                        return (
                            <div key={id} className="flex h-5 items-center space-x-3">
                                <Checkbox
                                    id={id}
                                    checked={isCompleted}
                                    onCheckedChange={() => handleTaskToggle(id)}
                                    className="h-3.5 w-3.5"
                                />
                                <div className="flex-1">
                                    <label
                                        htmlFor={id}
                                        className={`cursor-pointer leading-none flex items-center gap-2 transition-colors ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
                                    >
                                        {name}
                                    </label>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};

export default StrikesCard;
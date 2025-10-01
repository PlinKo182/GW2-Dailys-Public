import React, { useState } from 'react';
import useStore from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Swords, PencilIcon, TrashIcon } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const FRACTAL_CMS = [
    { name: "Nightmare", id: "fractal_cm_nightmare" },
    { name: "Shattered Observatory", id: "fractal_cm_shattered_observatory" },
    { name: "Sunqua Peak", id: "fractal_cm_sunqua_peak" },
    { name: "Silent Surf", id: "fractal_cm_silent_surf" },
    { name: "Lonely Tower", id: "fractal_cm_lonely_tower" },
    { name: "Kinfall", id: "fractal_cm_kinfall" },
];

const CM_TASK_IDS = FRACTAL_CMS.map(cm => cm.id);

const ChallengeModeCard = ({ card, taskCompletion, onTaskToggle, isEditMode }) => {
    const { updateCardTitle, deleteCard } = useStore(state => ({
        updateCardTitle: state.updateCardTitle,
        deleteCard: state.deleteCard,
    }));
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState(card.title);

    const completedCount = CM_TASK_IDS.filter(id => taskCompletion[id]).length;
    const totalTasks = CM_TASK_IDS.length;
    const areAllCmsCompleted = totalTasks > 0 && completedCount === totalTasks;

    const handleToggleAllCms = () => {
        if (isEditMode) return;
        const newCompletionState = !areAllCmsCompleted;
        CM_TASK_IDS.forEach(id => {
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
                                        onClick={handleToggleAllCms}
                                        className={`cursor-pointer hover:underline ${areAllCmsCompleted ? 'line-through text-muted-foreground' : ''}`}
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
                    {!isEditingTitle && (
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
                    {FRACTAL_CMS.map(({ id, name }) => {
                        const isCompleted = taskCompletion[id] || false;
                        return (
                            <div key={id} className="flex h-5 items-center space-x-3">
                                <Checkbox id={id} checked={isCompleted} onCheckedChange={() => onTaskToggle(id)} className="h-3.5 w-3.5" />
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

export default ChallengeModeCard;
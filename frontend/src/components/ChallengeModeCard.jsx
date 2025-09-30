import React from 'react';
import useStore from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Swords } from 'lucide-react';
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
].map(cm => ({ ...cm, name: `${cm.name} (CM)` }));

const CM_TASK_IDS = FRACTAL_CMS.map(cm => cm.id);

const ChallengeModeCard = () => {
    const { handleTaskToggle, taskCompletion } = useStore(state => ({
        handleTaskToggle: state.handleTaskToggle,
        taskCompletion: state.userData.taskCompletion,
    }));

    const completedCmTasks = CM_TASK_IDS.filter(id => taskCompletion[id]);
    const areAllCmsCompleted = completedCmTasks.length === CM_TASK_IDS.length;

    const handleToggleAllCms = () => {
        const newCompletionState = !areAllCmsCompleted;
        CM_TASK_IDS.forEach(id => {
            if (!!taskCompletion[id] !== newCompletionState) {
                handleTaskToggle(id, newCompletionState);
            }
        });
    };

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <CardTitle
                                onClick={handleToggleAllCms}
                                className={`cursor-pointer hover:underline ${areAllCmsCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Swords className="h-5 w-5" />
                                    Challenge Modes
                                </div>
                            </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to toggle all tasks</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </CardHeader>
            <CardContent>
                <ul className="space-y-2 text-sm">
                    {FRACTAL_CMS.map(({ id, name }) => (
                        <li key={id} className="flex items-center gap-2">
                            <Checkbox id={id} checked={taskCompletion[id]} onCheckedChange={() => handleTaskToggle(id)} />
                            <label htmlFor={id} className="text-muted-foreground cursor-pointer">{name}</label>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
};

export default ChallengeModeCard;
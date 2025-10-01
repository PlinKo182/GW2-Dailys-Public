import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Swords } from 'lucide-react';
import useStore from '../store/useStore';
import { fetchDailyStrikes } from '../utils/apiHelpers';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const StrikesCard = () => {
    const { handleTaskToggle, taskCompletion, strikesTasks, setStrikesTasks } = useStore(state => ({
        handleTaskToggle: state.handleTaskToggle,
        taskCompletion: state.userData.taskCompletion,
        strikesTasks: state.strikesTasks,
        setStrikesTasks: state.setStrikesTasks,
    }));

    React.useEffect(() => {
        const loadStrikes = async () => {
            try {
                const strikes = await fetchDailyStrikes();
                setStrikesTasks(strikes);
            } catch (error) {
                console.error("Error loading daily strikes:", error);
            }
        };
        loadStrikes();
    }, [setStrikesTasks]);

    const strikeTaskIds = (strikesTasks || []).map(t => t.id);
    const completedStrikeTasks = strikeTaskIds.filter(id => taskCompletion[id]);
    const areAllStrikesCompleted = strikeTaskIds.length > 0 && completedStrikeTasks.length === strikeTaskIds.length;

    const handleToggleAllStrikes = () => {
        const newCompletionState = !areAllStrikesCompleted;
        strikeTaskIds.forEach(id => {
            if (!!taskCompletion[id] !== newCompletionState) {
                handleTaskToggle(id, newCompletionState);
            }
        });
    };

    if (!strikesTasks?.length) return null;

    return (
        <Card>
            <CardHeader className="flex-row items-center justify-between">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger>
                            <CardTitle
                                onClick={handleToggleAllStrikes}
                                className={`cursor-pointer hover:underline ${areAllStrikesCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                                <div className="flex items-center gap-2">
                                    <Swords className="h-5 w-5" />
                                    Daily Strikes
                                </div>
                            </CardTitle>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Click to toggle all tasks</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
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
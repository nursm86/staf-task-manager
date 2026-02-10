import { useState } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';

export default function SubTasks({ subTasks = [], onChange, readOnly = false }) {
    const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

    const handleAddSubTask = () => {
        if (!newSubTaskTitle.trim()) return;
        const updatedSubTasks = [...subTasks, { title: newSubTaskTitle.trim(), completed: false }];
        onChange(updatedSubTasks);
        setNewSubTaskTitle('');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddSubTask();
        }
    };

    const handleToggleSubTask = (index) => {
        const updatedSubTasks = subTasks.map((subTask, subTaskIndex) =>
            subTaskIndex === index ? { ...subTask, completed: !subTask.completed } : subTask
        );
        onChange(updatedSubTasks);
    };

    const handleRemoveSubTask = (index) => {
        const updatedSubTasks = subTasks.filter((_, subTaskIndex) => subTaskIndex !== index);
        onChange(updatedSubTasks);
    };

    const completedCount = subTasks.filter((subTask) => subTask.completed).length;
    const totalCount = subTasks.length;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">Sub-tasks</label>
                {totalCount > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {completedCount}/{totalCount} completed
                    </span>
                )}
            </div>

            {/* Progress bar */}
            {totalCount > 0 && (
                <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-status-finished rounded-full transition-all duration-300"
                        style={{ width: `${(completedCount / totalCount) * 100}%` }}
                    />
                </div>
            )}

            {/* Sub-task list */}
            <div className="space-y-1.5">
                {subTasks.map((subTask, index) => (
                    <div
                        key={subTask._id || index}
                        className="flex items-center gap-2 group"
                    >
                        <button
                            type="button"
                            onClick={() => handleToggleSubTask(index)}
                            disabled={readOnly}
                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${subTask.completed
                                    ? 'bg-status-finished border-status-finished text-white'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            {subTask.completed && <Check className="w-3 h-3" />}
                        </button>
                        <span
                            className={`flex-1 text-sm ${subTask.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                                }`}
                        >
                            {subTask.title}
                        </span>
                        {!readOnly && (
                            <button
                                type="button"
                                onClick={() => handleRemoveSubTask(index)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Add sub-task */}
            {!readOnly && (
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newSubTaskTitle}
                        onChange={(e) => setNewSubTaskTitle(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add a sub-task..."
                        className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                    <button
                        type="button"
                        onClick={handleAddSubTask}
                        disabled={!newSubTaskTitle.trim()}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

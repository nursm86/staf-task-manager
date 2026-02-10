import { useState } from 'react';
import StatusBadge from './StatusBadge';
import { Eye, GripVertical, CheckSquare } from 'lucide-react';

export default function TaskList({ tasks, onTaskClick, onAuditClick, isLoading }) {
    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="bg-card border border-border rounded-xl p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-4 bg-secondary rounded" />
                            <div className="flex-1 h-4 bg-secondary rounded" />
                            <div className="w-20 h-6 bg-secondary rounded-lg" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                    <CheckSquare className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-medium">No tasks found</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Tasks matching your filters will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => {
                const completedSubTasks = task.sub_tasks?.filter((subTask) => subTask.completed).length || 0;
                const totalSubTasks = task.sub_tasks?.length || 0;

                return (
                    <div
                        key={task._id}
                        className="group bg-card border border-border hover:border-primary/30 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex items-center gap-3 px-4 py-3.5">
                            {/* Priority indicator */}
                            <div className="flex items-center gap-1 shrink-0">
                                <div
                                    className="w-2 h-8 rounded-full"
                                    style={{
                                        background: task.priority >= 5 ? '#ef4444' : task.priority >= 3 ? '#f97316' : task.priority >= 1 ? '#3b82f6' : '#64748b',
                                        opacity: 0.6,
                                    }}
                                    title={`Priority: ${task.priority}`}
                                />
                            </div>

                            {/* Task info */}
                            <div
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => onTaskClick(task._id)}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-sm font-medium text-foreground truncate">
                                        {task.title}
                                    </h3>
                                    {totalSubTasks > 0 && (
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {completedSubTasks}/{totalSubTasks}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="truncate">
                                        {task.assigned_to?.name || 'Unassigned'}
                                    </span>
                                    <span className="shrink-0">P: {task.priority}</span>
                                </div>
                            </div>

                            {/* Status badge */}
                            <StatusBadge status={task.status} className="shrink-0 hidden sm:inline-flex" />

                            {/* Mobile status dot */}
                            <div className="sm:hidden shrink-0">
                                <StatusBadge status={task.status} className="!px-1.5 !gap-0 [&>span:last-child]:hidden" />
                            </div>

                            {/* Audit eye */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAuditClick(task._id, task.title);
                                }}
                                className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                title="View Audit History"
                            >
                                <Eye className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

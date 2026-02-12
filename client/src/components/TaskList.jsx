import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import StatusBadge from './StatusBadge';
import api from '../lib/api';
import { Eye, CheckSquare, Calendar } from 'lucide-react';

const STATUSES = [
    'Assigned',
    'Working on it',
    'Waiting for review',
    'Pause for something else',
    'Finished',
    'Cancelled',
];

export default function TaskList({ tasks, onTaskClick, onAuditClick, isLoading }) {
    const queryClient = useQueryClient();

    const updateStatusMutation = useMutation({
        mutationFn: async ({ taskId, status }) => {
            const { data } = await api.put(`/tasks/${taskId}`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
    });

    const handleStatusChange = (e, taskId) => {
        e.stopPropagation();
        updateStatusMutation.mutate({ taskId, status: e.target.value });
    };

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
                        style={getUrgencyStyle(task)}
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
                                    {task.finished_by && (
                                        <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium ${getDeadlineBadgeClass(task)}`}>
                                            <Calendar className="w-2.5 h-2.5" />
                                            {formatFinishedBy(task.finished_by)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Inline status dropdown */}
                            <div className="shrink-0 relative" onClick={(e) => e.stopPropagation()}>
                                <select
                                    value={task.status}
                                    onChange={(e) => handleStatusChange(e, task._id)}
                                    disabled={updateStatusMutation.isPending}
                                    className="appearance-none bg-transparent text-xs font-medium pl-5 pr-6 py-1.5 rounded-lg border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                                    style={{
                                        borderColor: getStatusColor(task.status, 0.3),
                                        color: getStatusColor(task.status, 1),
                                        backgroundColor: getStatusColor(task.status, 0.1),
                                    }}
                                >
                                    {STATUSES.map((statusOption) => (
                                        <option key={statusOption} value={statusOption} className="bg-card text-foreground">
                                            {statusOption}
                                        </option>
                                    ))}
                                </select>
                                {/* Status dot */}
                                <span
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
                                    style={{ backgroundColor: getStatusColor(task.status, 1) }}
                                />
                                {/* Dropdown arrow */}
                                <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none" style={{ color: getStatusColor(task.status, 0.7) }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
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

function getStatusColor(status, opacity) {
    const colors = {
        'Assigned': `rgba(100, 116, 139, ${opacity})`,
        'Working on it': `rgba(59, 130, 246, ${opacity})`,
        'Waiting for review': `rgba(168, 85, 247, ${opacity})`,
        'Pause for something else': `rgba(249, 115, 22, ${opacity})`,
        'Finished': `rgba(34, 197, 94, ${opacity})`,
        'Cancelled': `rgba(239, 68, 68, ${opacity})`,
    };
    return colors[status] || colors['Assigned'];
}

function getDaysUntilDeadline(finishedBy) {
    if (!finishedBy) return null;
    const now = new Date();
    const deadline = new Date(finishedBy);
    // Compare dates only (ignore time)
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const deadlineStart = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate());
    const diffMs = deadlineStart - todayStart;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgencyStyle(task) {
    // Skip urgency coloring for completed/cancelled tasks
    if (task.status === 'Finished' || task.status === 'Cancelled') return {};

    const daysLeft = getDaysUntilDeadline(task.finished_by);
    if (daysLeft === null || daysLeft > 2) return {};

    if (daysLeft <= 0) {
        // Overdue or due today
        return {
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            borderColor: 'rgba(239, 68, 68, 0.5)',
            boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)',
        };
    } else if (daysLeft === 1) {
        // Tomorrow
        return {
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.08)',
        };
    } else {
        // 2 days away
        return {
            backgroundColor: 'rgba(249, 115, 22, 0.06)',
            borderColor: 'rgba(249, 115, 22, 0.2)',
        };
    }
}

function formatFinishedBy(finishedBy) {
    const date = new Date(finishedBy);
    return date.toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
    });
}

function getDeadlineBadgeClass(task) {
    if (task.status === 'Finished' || task.status === 'Cancelled') {
        return 'bg-secondary text-muted-foreground';
    }

    const daysLeft = getDaysUntilDeadline(task.finished_by);
    if (daysLeft === null || daysLeft > 2) return 'bg-secondary text-muted-foreground';
    if (daysLeft <= 0) return 'bg-red-500/20 text-red-400';
    if (daysLeft === 1) return 'bg-red-500/15 text-red-400';
    return 'bg-orange-500/15 text-orange-400';
}

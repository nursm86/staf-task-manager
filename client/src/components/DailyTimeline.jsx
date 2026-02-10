import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { format, differenceInMinutes } from 'date-fns';
import {
    Play,
    Pause,
    CheckCircle2,
    XCircle,
    Clock,
    Edit,
    UserPlus,
    Plus,
    AlertCircle,
} from 'lucide-react';

const ACTION_ICON_MAP = {
    'Updated Status': Clock,
    'Created': Plus,
    'Updated Title': Edit,
    'Updated Description': Edit,
    'Updated Assignment': UserPlus,
    'Updated Priority': AlertCircle,
    'Updated Sub-tasks': CheckCircle2,
    'Assigned': UserPlus,
    'Trashed': XCircle,
    'Restored': Play,
};

const STATUS_ICON_MAP = {
    'Working on it': { icon: Play, color: 'text-status-working', bg: 'bg-status-working/15' },
    'Finished': { icon: CheckCircle2, color: 'text-status-finished', bg: 'bg-status-finished/15' },
    'Pause for something else': { icon: Pause, color: 'text-status-pause', bg: 'bg-status-pause/15' },
    'Cancelled': { icon: XCircle, color: 'text-status-cancelled', bg: 'bg-status-cancelled/15' },
    'Waiting for review': { icon: Clock, color: 'text-status-review', bg: 'bg-status-review/15' },
    'Assigned': { icon: UserPlus, color: 'text-status-assigned', bg: 'bg-status-assigned/15' },
};

function getStatusIcon(action, newValue) {
    if (action === 'Updated Status' && newValue && STATUS_ICON_MAP[newValue]) {
        return STATUS_ICON_MAP[newValue];
    }
    const IconComponent = ACTION_ICON_MAP[action] || Clock;
    return { icon: IconComponent, color: 'text-primary', bg: 'bg-primary/15' };
}

function formatDuration(minutes) {
    if (minutes < 1) return 'less than a minute';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function buildTimelineEntries(logs) {
    const entries = [];
    const activeWorkSessions = {};

    for (const log of logs) {
        const taskTitle = log.task_id?.title || 'Unknown Task';
        const time = format(new Date(log.timestamp), 'h:mm a');

        if (log.action === 'Updated Status' && log.new_value) {
            const status = log.new_value;
            const taskId = log.task_id?._id || log.task_id;

            if (status === 'Working on it') {
                activeWorkSessions[taskId] = new Date(log.timestamp);
                entries.push({
                    time,
                    label: `Started working on "${taskTitle}"`,
                    type: 'start',
                    status,
                    timestamp: new Date(log.timestamp),
                });
            } else if (status === 'Finished') {
                let duration = null;
                if (activeWorkSessions[taskId]) {
                    const durationMinutes = differenceInMinutes(new Date(log.timestamp), activeWorkSessions[taskId]);
                    duration = formatDuration(durationMinutes);
                    delete activeWorkSessions[taskId];
                }
                entries.push({
                    time,
                    label: `Finished "${taskTitle}"${duration ? ` (Duration: ${duration})` : ''}`,
                    type: 'finish',
                    status,
                    timestamp: new Date(log.timestamp),
                });
            } else if (status === 'Pause for something else') {
                let duration = null;
                if (activeWorkSessions[taskId]) {
                    const durationMinutes = differenceInMinutes(new Date(log.timestamp), activeWorkSessions[taskId]);
                    duration = formatDuration(durationMinutes);
                    delete activeWorkSessions[taskId];
                }
                entries.push({
                    time,
                    label: `Paused "${taskTitle}"${duration ? ` (Active: ${duration})` : ''}`,
                    type: 'pause',
                    status,
                    timestamp: new Date(log.timestamp),
                });
            } else if (status === 'Waiting for review') {
                let duration = null;
                if (activeWorkSessions[taskId]) {
                    const durationMinutes = differenceInMinutes(new Date(log.timestamp), activeWorkSessions[taskId]);
                    duration = formatDuration(durationMinutes);
                    delete activeWorkSessions[taskId];
                }
                entries.push({
                    time,
                    label: `Sent "${taskTitle}" for review${duration ? ` (Active: ${duration})` : ''}`,
                    type: 'review',
                    status,
                    timestamp: new Date(log.timestamp),
                });
            } else {
                entries.push({
                    time,
                    label: `Changed "${taskTitle}" status to "${status}"`,
                    type: 'status',
                    status,
                    timestamp: new Date(log.timestamp),
                });
            }
        } else {
            entries.push({
                time,
                label: `${log.action}: "${taskTitle}"`,
                type: 'other',
                status: null,
                timestamp: new Date(log.timestamp),
            });
        }
    }

    return entries;
}

export default function DailyTimeline({ userId, selectedDate }) {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const { data: logs = [], isLoading } = useQuery({
        queryKey: ['timeline', userId, dateStr],
        queryFn: async () => {
            const { data } = await api.get(`/audit-logs/user/${userId}/timeline?date=${dateStr}`);
            return data;
        },
        enabled: !!userId,
    });

    const timelineEntries = buildTimelineEntries(logs);

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 bg-secondary rounded-full" />
                        <div className="flex-1">
                            <div className="h-4 bg-secondary rounded w-3/4 mb-2" />
                            <div className="h-3 bg-secondary rounded w-1/4" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (timelineEntries.length === 0) {
        return (
            <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No activity recorded</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                    No task changes for {format(selectedDate, 'MMMM d, yyyy')}
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-5 bottom-5 w-px bg-border" />

            <div className="space-y-4">
                {timelineEntries.map((entry, index) => {
                    const iconConfig = entry.status ? STATUS_ICON_MAP[entry.status] : null;
                    const IconComponent = iconConfig?.icon || Clock;
                    const iconColor = iconConfig?.color || 'text-primary';
                    const iconBg = iconConfig?.bg || 'bg-primary/15';

                    return (
                        <div key={index} className="relative flex gap-4 items-start">
                            {/* Icon */}
                            <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0 z-10`}>
                                <IconComponent className={`w-4.5 h-4.5 ${iconColor}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 pt-1.5">
                                <p className="text-sm text-foreground">{entry.label}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{entry.time}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

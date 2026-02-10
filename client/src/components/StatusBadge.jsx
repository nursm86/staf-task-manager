import { cn } from '../lib/utils';

const STATUS_CONFIG = {
    'Assigned': {
        color: 'bg-status-assigned/15 text-status-assigned border-status-assigned/30',
        dot: 'bg-status-assigned',
    },
    'Working on it': {
        color: 'bg-status-working/15 text-status-working border-status-working/30',
        dot: 'bg-status-working',
    },
    'Waiting for review': {
        color: 'bg-status-review/15 text-status-review border-status-review/30',
        dot: 'bg-status-review',
    },
    'Pause for something else': {
        color: 'bg-status-pause/15 text-status-pause border-status-pause/30',
        dot: 'bg-status-pause',
    },
    'Finished': {
        color: 'bg-status-finished/15 text-status-finished border-status-finished/30',
        dot: 'bg-status-finished',
    },
    'Cancelled': {
        color: 'bg-status-cancelled/15 text-status-cancelled border-status-cancelled/30',
        dot: 'bg-status-cancelled',
    },
};

export default function StatusBadge({ status, className }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['Assigned'];

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border',
                config.color,
                className
            )}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
            {status}
        </span>
    );
}

export { STATUS_CONFIG };

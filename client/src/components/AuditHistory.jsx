import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { format } from 'date-fns';
import { Clock, User, ArrowRight, X } from 'lucide-react';

export default function AuditHistory({ taskId, taskTitle, onClose }) {
    const { data: auditLogs = [], isLoading } = useQuery({
        queryKey: ['auditLogs', taskId],
        queryFn: async () => {
            const { data } = await api.get(`/audit-logs/task/${taskId}`);
            return data;
        },
        enabled: !!taskId,
    });

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Panel */}
            <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-slide-in-right">
                {/* Header */}
                <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-foreground">Audit History</h2>
                        <p className="text-sm text-muted-foreground truncate">{taskTitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : auditLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-muted-foreground text-sm">No audit history yet</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-[11px] top-3 bottom-3 w-px bg-border" />

                            <div className="space-y-4">
                                {auditLogs.map((log, index) => (
                                    <div key={log._id || index} className="relative flex gap-4">
                                        {/* Dot */}
                                        <div className="w-[23px] flex items-start justify-center pt-1.5 shrink-0">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 pb-2">
                                            <div className="bg-secondary/50 rounded-xl px-4 py-3 border border-border/50">
                                                <p className="text-sm font-medium text-foreground">{log.action}</p>

                                                {log.field_changed && (
                                                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                                                        <span className="text-muted-foreground">Field:</span>
                                                        <code className="px-1.5 py-0.5 bg-muted rounded text-foreground">
                                                            {log.field_changed}
                                                        </code>
                                                    </div>
                                                )}

                                                {(log.old_value || log.new_value) && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-xs flex-wrap">
                                                        {log.old_value && (
                                                            <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded-md">
                                                                {log.old_value}
                                                            </span>
                                                        )}
                                                        {log.old_value && log.new_value && (
                                                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                                        )}
                                                        {log.new_value && (
                                                            <span className="px-2 py-0.5 bg-status-finished/10 text-status-finished rounded-md">
                                                                {log.new_value}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {log.performed_by}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
        </div>
    );
}

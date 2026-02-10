import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import SubTasks from './SubTasks';
import StatusBadge from './StatusBadge';
import { X, Save, Trash2, RotateCcw } from 'lucide-react';

const STATUSES = [
    'Assigned',
    'Working on it',
    'Waiting for review',
    'Pause for something else',
    'Finished',
    'Cancelled',
];

export default function TaskDrawer({ taskId, onClose, isCreateMode = false }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'Assigned',
        assigned_to: '',
        priority: 0,
        sub_tasks: [],
    });
    const [hasChanges, setHasChanges] = useState(false);

    const { data: allUsers = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
    });

    const { data: taskData, isLoading: isLoadingTask } = useQuery({
        queryKey: ['task', taskId],
        queryFn: async () => {
            const { data } = await api.get(`/tasks/${taskId}`);
            return data;
        },
        enabled: !!taskId && !isCreateMode,
    });

    useEffect(() => {
        if (taskData && !isCreateMode) {
            setFormData({
                title: taskData.title || '',
                description: taskData.description || '',
                status: taskData.status || 'Assigned',
                assigned_to: taskData.assigned_to?._id || '',
                priority: taskData.priority || 0,
                sub_tasks: taskData.sub_tasks || [],
            });
        }
    }, [taskData, isCreateMode]);

    const createTaskMutation = useMutation({
        mutationFn: async (data) => {
            const { data: responseData } = await api.post('/tasks', data);
            return responseData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            onClose();
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async (data) => {
            const { data: responseData } = await api.put(`/tasks/${taskId}`, data);
            return responseData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            onClose();
        },
    });

    const trashTaskMutation = useMutation({
        mutationFn: async () => {
            const { data } = await api.patch(`/tasks/${taskId}/trash`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            onClose();
        },
    });

    const handleFieldChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title.trim()) return;

        const submitData = {
            ...formData,
            assigned_to: formData.assigned_to || null,
        };

        if (isCreateMode) {
            createTaskMutation.mutate(submitData);
        } else {
            updateTaskMutation.mutate(submitData);
        }
    };

    const isSaving = createTaskMutation.isPending || updateTaskMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />

            {/* Drawer */}
            <div className="relative w-full max-w-lg bg-card border-l border-border h-full flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <h2 className="text-lg font-semibold text-foreground">
                        {isCreateMode ? 'Create Task' : 'Edit Task'}
                    </h2>
                    <div className="flex items-center gap-1">
                        {!isCreateMode && (
                            <button
                                onClick={() => trashTaskMutation.mutate()}
                                disabled={trashTaskMutation.isPending}
                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                title={taskData?.is_trashed ? 'Restore' : 'Move to Trash'}
                            >
                                {taskData?.is_trashed ? (
                                    <RotateCcw className="w-4 h-4" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                {isLoadingTask && !isCreateMode ? (
                    <div className="flex items-center justify-center flex-1">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Title <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleFieldChange('title', e.target.value)}
                                    placeholder="Task title"
                                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    placeholder="Add a description..."
                                    rows={4}
                                    className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                                />
                            </div>

                            {/* Status */}
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1.5">
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        value={formData.status}
                                        onChange={(e) => handleFieldChange('status', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        {STATUSES.map((statusOption) => (
                                            <option key={statusOption} value={statusOption}>
                                                {statusOption}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <StatusBadge status={formData.status} />
                                    </div>
                                </div>
                            </div>

                            {/* Priority & Assigned To row */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Priority
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={formData.priority}
                                        onChange={(e) => handleFieldChange('priority', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">
                                        Assign To
                                    </label>
                                    <select
                                        value={formData.assigned_to}
                                        onChange={(e) => handleFieldChange('assigned_to', e.target.value)}
                                        className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Unassigned</option>
                                        {allUsers.map((u) => (
                                            <option key={u._id} value={u._id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Sub-tasks */}
                            <div className="border-t border-border pt-5">
                                <SubTasks
                                    subTasks={formData.sub_tasks}
                                    onChange={(updatedSubTasks) => handleFieldChange('sub_tasks', updatedSubTasks)}
                                />
                            </div>

                            {/* Meta info for existing tasks */}
                            {!isCreateMode && taskData && (
                                <div className="border-t border-border pt-5 space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        Created by <span className="text-foreground">{taskData.created_by?.name}</span>
                                        {' · '}
                                        {new Date(taskData.created_at).toLocaleDateString()}
                                    </p>
                                    {taskData.updated_by && (
                                        <p className="text-xs text-muted-foreground">
                                            Last updated by{' '}
                                            <span className="text-foreground">{taskData.updated_by?.name}</span>
                                            {' · '}
                                            {new Date(taskData.updated_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-medium rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || !formData.title.trim()}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {isSaving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {isCreateMode ? 'Create' : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
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

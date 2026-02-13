import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import TaskList from '../components/TaskList';
import TaskDrawer from '../components/TaskDrawer';
import AuditHistory from '../components/AuditHistory';
import { Plus, Filter, Trash2 } from 'lucide-react';

const STATUSES = [
    { value: 'all', label: 'All Statuses' },
    { value: 'Assigned', label: 'Assigned' },
    { value: 'Working on it', label: 'Working on it' },
    { value: 'Waiting for review', label: 'Waiting for review' },
    { value: 'Pause for something else', label: 'Pause for something else' },
    { value: 'Finished', label: 'Finished' },
    { value: 'Cancelled', label: 'Cancelled' },
];

export default function Dashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('my-tasks');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isCreateMode, setIsCreateMode] = useState(false);
    const [auditState, setAuditState] = useState({ taskId: null, taskTitle: '' });

    const { data: allUsers = [] } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const { data } = await api.get('/users');
            return data;
        },
    });

    // Build query params
    const queryParams = new URLSearchParams();
    if (statusFilter !== 'all') queryParams.set('status', statusFilter);

    if (activeTab === 'my-tasks') {
        queryParams.set('tab', 'my-tasks');
    } else if (activeTab === 'unassigned') {
        queryParams.set('tab', 'unassigned');
    } else if (activeTab === 'trash') {
        queryParams.set('tab', 'trash');
    } else {
        queryParams.set('assigned_to', activeTab);
    }

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['tasks', activeTab, statusFilter],
        queryFn: async () => {
            const { data } = await api.get(`/tasks?${queryParams.toString()}`);
            return data;
        },
    });

    // Fetch tab counts
    const { data: tabCounts = {} } = useQuery({
        queryKey: ['taskCounts'],
        queryFn: async () => {
            const { data } = await api.get('/tasks/counts');
            return data;
        },
        refetchInterval: 30000, // Refresh every 30 seconds
    });

    // Build tabs
    const otherUsers = allUsers.filter((u) => u._id !== user?._id);
    const tabs = [
        { id: 'my-tasks', label: 'My Tasks' },
        { id: 'unassigned', label: 'Unassigned' },
        ...otherUsers.map((u) => ({ id: u._id, label: u.name })),
        { id: 'trash', label: 'Trash', icon: true },
    ];

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Welcome back, {user?.name}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setSelectedTaskId(null);
                        setIsCreateMode(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors cursor-pointer shrink-0"
                >
                    <Plus className="w-4 h-4" />
                    New Task
                </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3 mb-4">
                <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all appearance-none cursor-pointer"
                >
                    {STATUSES.map((statusOption) => (
                        <option key={statusOption.value} value={statusOption.value}>
                            {statusOption.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
                {tabs.map((tab) => {
                    const count = tabCounts[tab.id];
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                                ? tab.id === 'trash'
                                    ? 'bg-destructive/80 text-white shadow-md shadow-destructive/20'
                                    : 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                : tab.id === 'trash'
                                    ? 'bg-secondary text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {tab.icon && <Trash2 className="w-3.5 h-3.5" />}
                            {tab.label}
                            {count !== undefined && count > 0 && (
                                <span className={`ml-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-primary/10 text-primary'
                                    }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Task List */}
            <TaskList
                tasks={tasks}
                isLoading={isLoading}
                activeTab={activeTab}
                onTaskClick={(taskId) => {
                    setSelectedTaskId(taskId);
                    setIsCreateMode(false);
                }}
                onAuditClick={(taskId, taskTitle) => {
                    setAuditState({ taskId, taskTitle });
                }}
            />

            {/* Task Drawer */}
            {(selectedTaskId || isCreateMode) && (
                <TaskDrawer
                    taskId={selectedTaskId}
                    isCreateMode={isCreateMode}
                    onClose={() => {
                        setSelectedTaskId(null);
                        setIsCreateMode(false);
                    }}
                />
            )}

            {/* Audit History */}
            {auditState.taskId && (
                <AuditHistory
                    taskId={auditState.taskId}
                    taskTitle={auditState.taskTitle}
                    onClose={() => setAuditState({ taskId: null, taskTitle: '' })}
                />
            )}
        </div>
    );
}

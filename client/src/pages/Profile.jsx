import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import DailyTimeline from '../components/DailyTimeline';
import { format } from 'date-fns';
import {
    CheckCircle2,
    Zap,
    ListTodo,
    ChevronLeft,
    ChevronRight,
    Calendar,
} from 'lucide-react';

export default function Profile() {
    const { id } = useParams();
    const [selectedDate, setSelectedDate] = useState(new Date());

    const { data: userStats, isLoading } = useQuery({
        queryKey: ['userStats', id],
        queryFn: async () => {
            const { data } = await api.get(`/users/${id}/stats`);
            return data;
        },
        enabled: !!id,
    });

    const navigateDay = (direction) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + direction);
        setSelectedDate(newDate);
    };

    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    if (isLoading) {
        return (
            <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-secondary rounded w-48" />
                    <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-24 bg-secondary rounded-xl" />
                        ))}
                    </div>
                    <div className="h-96 bg-secondary rounded-xl" />
                </div>
            </div>
        );
    }

    const userName = userStats?.user?.name || 'User';
    const stats = userStats?.stats || {};

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {userName.charAt(0)}
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{userName}</h1>
                    <p className="text-sm text-muted-foreground">{userStats?.user?.role}</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-status-finished/15 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-status-finished" />
                        </div>
                        <span className="text-sm text-muted-foreground">Completed</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.completedTasks || 0}</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-status-working/15 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-status-working" />
                        </div>
                        <span className="text-sm text-muted-foreground">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.activeTasks || 0}</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <ListTodo className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground">Total Assigned</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{stats.totalTasks || 0}</p>
                </div>
            </div>

            {/* Daily Timeline Section */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Timeline Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Daily Timeline</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateDay(-1)}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={format(selectedDate, 'yyyy-MM-dd')}
                                onChange={(e) => setSelectedDate(new Date(e.target.value + 'T00:00:00'))}
                                className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            {!isToday && (
                                <button
                                    onClick={() => setSelectedDate(new Date())}
                                    className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
                                >
                                    Today
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => navigateDay(1)}
                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Timeline Content */}
                <div className="p-6">
                    <DailyTimeline userId={id} selectedDate={selectedDate} />
                </div>
            </div>
        </div>
    );
}

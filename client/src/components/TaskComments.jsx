import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import { MessageSquare, Send } from 'lucide-react';

export default function TaskComments({ taskId, comments = [] }) {
    const [newCommentText, setNewCommentText] = useState('');
    const [displayComments, setDisplayComments] = useState(comments);
    const queryClient = useQueryClient();
    const { user } = useAuth();

    // Sync local state when parent data updates (e.g. from refetch)
    useEffect(() => {
        setDisplayComments(comments);
    }, [comments]);

    const addCommentMutation = useMutation({
        mutationFn: async (text) => {
            const { data } = await api.post(`/tasks/${taskId}/comments`, { text });
            return data;
        },
        onMutate: async (text) => {
            // Optimistic update — show the comment immediately
            const optimisticComment = {
                _id: `temp-${Date.now()}`,
                text,
                author_name: user?.name || 'You',
                author_id: user?._id,
                created_at: new Date().toISOString(),
            };
            setDisplayComments((prev) => [...prev, optimisticComment]);
            setNewCommentText('');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['task', taskId] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
        onError: (error) => {
            // Revert optimistic update on error
            setDisplayComments(comments);
            setNewCommentText('');
            alert(error.response?.data?.message || 'Failed to add comment');
        },
    });

    const handleAddComment = () => {
        if (!newCommentText.trim() || addCommentMutation.isPending) return;
        addCommentMutation.mutate(newCommentText);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddComment();
        }
    };

    const formatCommentTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        }) + ' · ' + date.toLocaleTimeString('en-AU', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Generate a consistent color for an author name
    const getAuthorColor = (name) => {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash % 360);
        return `hsl(${hue}, 60%, 55%)`;
    };

    const getAuthorInitial = (name) => {
        return name ? name.charAt(0).toUpperCase() : '?';
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    Comments
                </label>
                {displayComments.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        {displayComments.length} comment{displayComments.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* Comment list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {displayComments.length === 0 && (
                    <p className="text-xs text-muted-foreground/60 italic py-2">
                        No comments yet. Be the first to add one.
                    </p>
                )}
                {displayComments.map((comment) => (
                    <div
                        key={comment._id}
                        className="flex gap-2.5"
                    >
                        {/* Author avatar */}
                        <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
                            style={{ backgroundColor: getAuthorColor(comment.author_name) }}
                        >
                            {getAuthorInitial(comment.author_name)}
                        </div>

                        {/* Comment body */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-semibold text-foreground">
                                    {comment.author_name}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60">
                                    {formatCommentTime(comment.created_at)}
                                </span>
                            </div>
                            <p className="text-sm text-foreground/80 mt-0.5 whitespace-pre-wrap break-words">
                                {comment.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add comment input */}
            {taskId && (
                <div className="flex items-end gap-2">
                    <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write a comment..."
                        rows={1}
                        className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                    />
                    <button
                        type="button"
                        onClick={handleAddComment}
                        disabled={!newCommentText.trim() || addCommentMutation.isPending}
                        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 cursor-pointer shrink-0"
                        title="Add comment"
                    >
                        {addCommentMutation.isPending ? (
                            <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}

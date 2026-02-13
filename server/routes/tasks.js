const express = require('express');
const Task = require('../models/Task');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Helper: create audit log entries for changed fields
const createAuditLogs = async (taskId, changes, performedBy) => {
    const auditEntries = changes.map((change) => ({
        task_id: taskId,
        action: change.action,
        field_changed: change.field,
        old_value: change.oldValue != null ? String(change.oldValue) : null,
        new_value: change.newValue != null ? String(change.newValue) : null,
        performed_by: performedBy.name,
        performed_by_id: performedBy._id,
    }));

    await AuditLog.insertMany(auditEntries);
};

// GET /api/tasks/counts — task counts per tab
router.get('/counts', async (req, res) => {
    try {
        const users = await User.find({}, '_id name');
        const currentUserId = req.user._id;

        // Aggregate counts for non-trashed tasks
        const countsPipeline = [
            { $match: { is_trashed: false } },
            {
                $group: {
                    _id: '$assigned_to',
                    count: { $sum: 1 },
                },
            },
        ];

        const countsResult = await Task.aggregate(countsPipeline);

        // Build counts map: userId -> count
        const countsMap = {};
        let unassignedCount = 0;

        for (const entry of countsResult) {
            if (entry._id === null) {
                unassignedCount = entry.count;
            } else {
                countsMap[entry._id.toString()] = entry.count;
            }
        }

        // Count trashed tasks
        const trashedCount = await Task.countDocuments({ is_trashed: true });

        // Build response
        const tabCounts = {
            'my-tasks': countsMap[currentUserId.toString()] || 0,
            unassigned: unassignedCount,
            trash: trashedCount,
        };

        // Add counts for each user
        for (const u of users) {
            if (u._id.toString() !== currentUserId.toString()) {
                tabCounts[u._id.toString()] = countsMap[u._id.toString()] || 0;
            }
        }

        res.json(tabCounts);
    } catch (error) {
        console.error('Get task counts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/tasks — list tasks
router.get('/', async (req, res) => {
    try {
        const { status, assigned_to, tab } = req.query;

        // Trash tab shows trashed items; all other tabs show non-trashed
        const filter = tab === 'trash' ? { is_trashed: true } : { is_trashed: false };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (tab === 'trash') {
            // No additional assignment filter for trash
        } else if (tab === 'my-tasks') {
            filter.assigned_to = req.user._id;
        } else if (tab === 'unassigned') {
            filter.assigned_to = null;
        } else if (assigned_to) {
            filter.assigned_to = assigned_to;
        }

        const tasks = await Task.find(filter)
            .populate('assigned_to', 'name')
            .populate('created_by', 'name')
            .populate('updated_by', 'name');

        // Sort: tasks with finished_by date first (ascending), then tasks without, then by priority desc
        tasks.sort((a, b) => {
            const aDate = a.finished_by ? new Date(a.finished_by).getTime() : null;
            const bDate = b.finished_by ? new Date(b.finished_by).getTime() : null;

            if (aDate && bDate) {
                if (aDate !== bDate) return aDate - bDate;
            } else if (aDate && !bDate) {
                return -1;
            } else if (!aDate && bDate) {
                return 1;
            }

            // Secondary sort by priority descending
            return (b.priority || 0) - (a.priority || 0);
        });

        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/tasks — create task
router.post('/', async (req, res) => {
    try {
        const { title, description, status, assigned_to, priority, sub_tasks, finished_by } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const taskData = {
            title: title.trim(),
            description: description || '',
            status: status || 'Assigned',
            assigned_to: assigned_to || null,
            priority: priority || 0,
            finished_by: finished_by || null,
            created_by: req.user._id,
            updated_by: req.user._id,
            sub_tasks: sub_tasks || [],
        };

        const task = await Task.create(taskData);

        // Create audit log for task creation
        const auditChanges = [{ action: 'Created', field: null, oldValue: null, newValue: title }];

        if (assigned_to) {
            const assignedUser = await User.findById(assigned_to);
            if (assignedUser) {
                auditChanges.push({
                    action: 'Assigned',
                    field: 'assigned_to',
                    oldValue: null,
                    newValue: assignedUser.name,
                });
            }
        }

        await createAuditLogs(task._id, auditChanges, req.user);

        const populatedTask = await Task.findById(task._id)
            .populate('assigned_to', 'name')
            .populate('created_by', 'name')
            .populate('updated_by', 'name');

        res.status(201).json(populatedTask);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/tasks/:id — get single task
router.get('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assigned_to', 'name')
            .populate('created_by', 'name')
            .populate('updated_by', 'name');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT /api/tasks/:id — update task
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assigned_to', 'name');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const updatableFields = ['title', 'description', 'status', 'assigned_to', 'priority', 'sub_tasks', 'finished_by'];
        const changes = [];

        for (const field of updatableFields) {
            if (req.body[field] === undefined) continue;

            const oldValue = task[field];
            const newValue = req.body[field];

            if (field === 'assigned_to') {
                const oldAssignedId = oldValue ? oldValue._id?.toString() : null;
                const newAssignedId = newValue || null;

                if (oldAssignedId !== newAssignedId) {
                    const oldName = oldValue ? oldValue.name : 'Unassigned';
                    let newName = 'Unassigned';
                    if (newAssignedId) {
                        const newUser = await User.findById(newAssignedId);
                        newName = newUser ? newUser.name : 'Unknown';
                    }
                    changes.push({
                        action: 'Updated Assignment',
                        field: 'assigned_to',
                        oldValue: oldName,
                        newValue: newName,
                    });
                    task.assigned_to = newAssignedId;
                }
            } else if (field === 'sub_tasks') {
                task.sub_tasks = newValue;
                changes.push({
                    action: 'Updated Sub-tasks',
                    field: 'sub_tasks',
                    oldValue: null,
                    newValue: null,
                });
            } else if (field === 'finished_by') {
                const oldDate = oldValue ? new Date(oldValue).toISOString().split('T')[0] : null;
                const newDate = newValue ? new Date(newValue).toISOString().split('T')[0] : null;

                if (oldDate !== newDate) {
                    changes.push({
                        action: 'Updated Finished By',
                        field: 'finished_by',
                        oldValue: oldDate || 'None',
                        newValue: newDate || 'None',
                    });
                    task.finished_by = newValue || null;
                }
            } else if (String(oldValue) !== String(newValue)) {
                const actionMap = {
                    title: 'Updated Title',
                    description: 'Updated Description',
                    status: 'Updated Status',
                    priority: 'Updated Priority',
                };

                changes.push({
                    action: actionMap[field] || `Updated ${field}`,
                    field,
                    oldValue: oldValue,
                    newValue: newValue,
                });
                task[field] = newValue;
            }
        }

        if (changes.length > 0) {
            task.updated_by = req.user._id;
            await task.save();
            await createAuditLogs(task._id, changes, req.user);
        }

        const updatedTask = await Task.findById(task._id)
            .populate('assigned_to', 'name')
            .populate('created_by', 'name')
            .populate('updated_by', 'name');

        res.json(updatedTask);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PATCH /api/tasks/:id/trash — soft delete
router.patch('/:id/trash', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.is_trashed = !task.is_trashed;
        task.updated_by = req.user._id;
        await task.save();

        await createAuditLogs(task._id, [{
            action: task.is_trashed ? 'Trashed' : 'Restored',
            field: 'is_trashed',
            oldValue: !task.is_trashed,
            newValue: task.is_trashed,
        }], req.user);

        res.json(task);
    } catch (error) {
        console.error('Trash task error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/tasks/:id/comments — add a comment (append-only, no delete)
router.post('/:id/comments', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({ message: 'Comment text is required' });
        }

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const comment = {
            text: text.trim(),
            author_name: req.user.name,
            author_id: req.user._id,
        };

        task.comments.push(comment);
        task.updated_by = req.user._id;
        await task.save();

        await createAuditLogs(task._id, [{
            action: 'Added Comment',
            field: 'comments',
            oldValue: null,
            newValue: text.trim(),
        }], req.user);

        const updatedTask = await Task.findById(task._id)
            .populate('assigned_to', 'name')
            .populate('created_by', 'name')
            .populate('updated_by', 'name');

        res.status(201).json(updatedTask);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

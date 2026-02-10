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

// GET /api/tasks — list tasks
router.get('/', async (req, res) => {
    try {
        const { status, assigned_to, tab } = req.query;
        const filter = { is_trashed: false };

        if (status && status !== 'all') {
            filter.status = status;
        }

        if (tab === 'my-tasks') {
            filter.assigned_to = req.user._id;
        } else if (tab === 'unassigned') {
            filter.assigned_to = null;
        } else if (assigned_to) {
            filter.assigned_to = assigned_to;
        }

        const tasks = await Task.find(filter)
            .populate('assigned_to', 'name')
            .populate('created_by', 'name')
            .populate('updated_by', 'name')
            .sort({ priority: -1, created_at: -1 });

        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/tasks — create task
router.post('/', async (req, res) => {
    try {
        const { title, description, status, assigned_to, priority, sub_tasks } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }

        const taskData = {
            title: title.trim(),
            description: description || '',
            status: status || 'Assigned',
            assigned_to: assigned_to || null,
            priority: priority || 0,
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

        const updatableFields = ['title', 'description', 'status', 'assigned_to', 'priority', 'sub_tasks'];
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

module.exports = router;

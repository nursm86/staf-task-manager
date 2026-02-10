const express = require('express');
const User = require('../models/User');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/users — list all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/users/:id/stats — user stats
router.get('/:id/stats', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const completedTasksCount = await Task.countDocuments({
            assigned_to: req.params.id,
            status: 'Finished',
            is_trashed: false,
        });

        const activeTasksCount = await Task.countDocuments({
            assigned_to: req.params.id,
            status: { $in: ['Assigned', 'Working on it', 'Waiting for review', 'Pause for something else'] },
            is_trashed: false,
        });

        const totalTasksCount = await Task.countDocuments({
            assigned_to: req.params.id,
            is_trashed: false,
        });

        res.json({
            user,
            stats: {
                completedTasks: completedTasksCount,
                activeTasks: activeTasksCount,
                totalTasks: totalTasksCount,
            },
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

const express = require('express');
const AuditLog = require('../models/AuditLog');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// GET /api/audit-logs/task/:taskId — audit history for a task
router.get('/task/:taskId', async (req, res) => {
    try {
        const logs = await AuditLog.find({ task_id: req.params.taskId })
            .sort({ timestamp: -1 });

        res.json(logs);
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/audit-logs/user/:userId/timeline — daily timeline for a user
router.get('/user/:userId/timeline', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date ? new Date(date) : new Date();

        // Start and end of the target day
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const logs = await AuditLog.find({
            performed_by_id: req.params.userId,
            timestamp: { $gte: startOfDay, $lte: endOfDay },
        })
            .populate({
                path: 'task_id',
                select: 'title',
            })
            .sort({ timestamp: 1 });

        res.json(logs);
    } catch (error) {
        console.error('Get timeline error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

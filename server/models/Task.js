const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    completed: {
        type: Boolean,
        default: false,
    },
}, { _id: true });

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: [
            'Assigned',
            'Working on it',
            'Waiting for review',
            'Pause for something else',
            'Finished',
            'Cancelled',
        ],
        default: 'Assigned',
    },
    assigned_to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    priority: {
        type: Number,
        default: 0,
    },
    finished_by: {
        type: Date,
        default: null,
    },
    is_trashed: {
        type: Boolean,
        default: false,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    updated_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    sub_tasks: [subTaskSchema],
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
});

taskSchema.index({ priority: -1 });
taskSchema.index({ assigned_to: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ finished_by: 1, priority: -1 });

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;

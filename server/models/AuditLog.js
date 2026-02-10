const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    task_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    field_changed: {
        type: String,
        default: null,
    },
    old_value: {
        type: String,
        default: null,
    },
    new_value: {
        type: String,
        default: null,
    },
    performed_by: {
        type: String,
        required: true,
    },
    performed_by_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

auditLogSchema.index({ task_id: 1, timestamp: -1 });
auditLogSchema.index({ performed_by_id: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;

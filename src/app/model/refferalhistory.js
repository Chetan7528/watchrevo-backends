'use strict';

const mongoose = require('mongoose');
const refferelHistorySchema = new mongoose.Schema({
    code: {
        type: String,
    },
    invitee_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    inviter_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    refferal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RefferelCode",
    },
    status: {
        type: String,
        default: 'Pending'
    },
}, {
    timestamps: true
});

refferelHistorySchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('RefferelHistory', refferelHistorySchema);
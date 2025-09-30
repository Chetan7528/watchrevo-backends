'use strict';

const mongoose = require('mongoose');
const refferelcodeSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    invitee_user: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    }],
    inviter_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    invitee_ticket_type: {
        type: String,
    },
    invitee_tickets: {
        type: Number
    },

    inviter_ticket_type: {
        type: String,
    },
    inviter_tickets: {
        type: Number
    },

    status: {
        type: String,
        default: 'Active'
    },
}, {
    timestamps: true
});

refferelcodeSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('RefferelCode', refferelcodeSchema);
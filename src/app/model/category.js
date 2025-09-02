'use strict';

const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    name: {
        type: String,
    },
    status: {
        type: String,
        default: 'Active'
    },
}, {
    timestamps: true
});

categorySchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Category', categorySchema);
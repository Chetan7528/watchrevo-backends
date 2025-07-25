'use strict';

const mongoose = require('mongoose');
const settingSchema = new mongoose.Schema({

    img: {
        type: String
    },
    link: {
        type: String
    }



}, {
    timestamps: true
});

settingSchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('Setting', settingSchema);
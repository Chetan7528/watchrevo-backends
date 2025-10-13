'use strict';

const mongoose = require('mongoose');
const lotteryrequestchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    ticketnumber: [{
        type: String,
    }],
    lottery: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "lottery",
    },
    total: {
        type: Number
    },

    quantity: {
        type: Number
    }
}, {
    timestamps: true
});

// lotteryrequestchema.set('toJSON', {
//     getters: true,
//     virtuals: false,
//     transform: (doc, ret, options) => {
//         delete ret.__v;
//         return ret;
//     }
// });
lotteryrequestchema.index({ lottery: 1 });
lotteryrequestchema.index({ "ticketnumber": 1 });

module.exports = mongoose.model('LotteryRequest', lotteryrequestchema);
'use strict';

const mongoose = require('mongoose');
const productrequestchema = new mongoose.Schema({
    // category: [{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Category",
    // }],
    productDetail: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
            image: [{
                type: String,
            }],
            total: {
                type: Number
            },
            qty: {
                type: Number
            },
            price: {
                type: Number
            },
            status: {
                type: String,
                default: 'Pending'
            },
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    shiping_address: {
        type: Object,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
    },
    total: {
        type: Number
    },
    order_id: {
        type: String
    },
    payment_mathod: {
        type: String
    }


}, {
    timestamps: true
});

productrequestchema.set('toJSON', {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    }
});

module.exports = mongoose.model('ProductRequest', productrequestchema);
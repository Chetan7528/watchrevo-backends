"use strict";

const mongoose = require("mongoose");
//const { uniq, unique } = require("underscore");
const bcrypt = require("bcryptjs");


const ticketHistorySchema = new mongoose.Schema(
    {
        ticket_type: {
            type: String,
            enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Free'],
            default: 'Bronze'
        },
        tickets: {
            type: Number,
            default: 0
        },
        refferCode: {
            type: String
        },
        inviter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        type: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);
ticketHistorySchema.set("toJSON", {
    getters: true,
    virtuals: false,
    transform: (doc, ret, options) => {
        delete ret.__v;
        return ret;
    },
});

module.exports = mongoose.model("TicketHistory", ticketHistorySchema);

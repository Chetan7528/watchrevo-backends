"use strict";

const mongoose = require("mongoose");

const contentSchema = new mongoose.Schema(
    {
        termsAndConditions: {
            type: String,
        },
        privacy: {
            type: String,
        },
        aboutCompany: {
            type: String,
        },
        aboutShipping: {
            type: String,
        },
        specifiedCommercialTransactions: {
            type: String,
        }
    },
    {
        timestamps: true,
    }
);


module.exports = mongoose.model("Content", contentSchema);
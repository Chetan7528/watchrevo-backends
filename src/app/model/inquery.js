"use strict";

const mongoose = require("mongoose");

const inquerySchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    email: {
      type: String,
    },
    phone: {
      type: String,
    },
    subject: {
      type: String,
    },
    orderid: {
      type: String,
    },
    description: {
      type: String,
    },
    posted_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Inquery", inquerySchema);

"use strict";

const mongoose = require("mongoose");
const notificationSchema = new mongoose.Schema(
  {
    notification: {
      type: "string",
    },
    users: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    users_type: { type: "string", },
    type: {
      type: "string",
    },
    lottery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "lottery",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    }
  },
  {
    timestamps: true,
  }
);

notificationSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Notification", notificationSchema);

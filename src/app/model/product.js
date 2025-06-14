"use strict";

const mongoose = require("mongoose");
const productchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    image: [{ type: String }],
    favouritelist: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    description: {
      type: String,
    },
    price: {
      type: Number,
    },
    dollar_price: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["verified", "suspended"],
      default: "verified",
    },
  },
  {
    timestamps: true,
  }
);

productchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Product", productchema);

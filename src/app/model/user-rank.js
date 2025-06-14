"use strict";

const mongoose = require("mongoose");
//const { uniq, unique } = require("underscore");
const bcrypt = require("bcryptjs");


const userRankSchema = new mongoose.Schema(
  {
    rank_type: {
      type: String,
      enum: ['Bronze', 'Silver','Gold', 'Platinum','Diamond'],
      default:'Bronze'
    },
    spent_yen:{
     type:Number,
     default:0
    },
    totalspent_yen:{
      type:Number,
      default:0
     },
    rankedDate:{
     type:Date
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
  },
  {
    timestamps: true,
  }
);
userRankSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("UserRank", userRankSchema);

"use strict";

const mongoose = require("mongoose");
//const { uniq, unique } = require("underscore");
const bcrypt = require("bcryptjs");


const userSchema = new mongoose.Schema(
  {
    profile: {
      type: String,
    },
    username: {
      type: String,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
    },
    password: {
      type: String,
    },
    type: {
      type: String,
      enum: ['ADMIN', 'USER']
    },
    rank_type: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Platinam'],
      default: 'Bronze'
    },
    spent_yen: {
      type: Number,
      default: 0
    },
    totalspent_yen: {
      type: Number,
      default: 0
    },
    rankedDate: {
      type: Date
    },
    surname: {
      type: String,
    },
    name: {
      type: String,
    },
    lastname: {
      type: String,
    },
    firstname: {
      type: String,
    },
    postalcode: {
      type: String,
    },
    prefectures: {
      type: String,
    },
    city: {
      type: String,
    },
    buildingname: {
      type: String,
    },
    // shippingaddress: {
    //   type: Object
    // },
    shiping_address: {
      type: Object
    },
    wallet: {
      type: Object,
      default: {
        Bronze: 0,
        Silver: 0,
        Gold: 0,
        Platinam: 0,
        Diamond: 0
      }
    },
    Bronze: {
      type: Number,
      default: 0
    },
    Silver: {
      type: Number,
      default: 0
    },
    Gold: {
      type: Number,
      default: 0
    },
    Platinam: {
      type: Number,
      default: 0
    },
    Diamond: {
      type: Number,
      default: 0
    },
    country: {
      type: Object
    },
    my_images: {
      type: []
    },
    description: {
      type: String,
    },
    payment_customer_id: {
      type: String,
    },
    payment_mathod: {
      type: String,
    },
    last_product_purchase_date: {
      type: Date,
    },
    refferal_uniquecode: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);
userSchema.set("toJSON", {
  getters: true,
  virtuals: false,
  transform: (doc, ret, options) => {
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.encryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};
userSchema.methods.isValidPassword = function isValidPassword(password) {
  return bcrypt.compareSync(password, this.password);
};
userSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("User", userSchema);

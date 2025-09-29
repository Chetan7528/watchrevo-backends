"use strict";
const userHelper = require("./../helper/user");
const response = require("./../responses");
const passport = require("passport");
const jwtService = require("./../services/jwtService");
const mailNotification = require("./../services/mailNotification");
const mongoose = require("mongoose");
const { notify } = require("../services/notification");
const RefferelCode = mongoose.model("RefferelCode");
const RefferelHistory = mongoose.model("RefferelHistory");
// const { notify } = require("../services/notification");

const User = mongoose.model("User");
const Verification = mongoose.model("Verification");
const Device = mongoose.model("Device");

module.exports = {

  signUp: async (req, res) => {
    try {
      const payload = req.body;
      const mail = req.body.email;
      if (!mail) {
        return response.badReq(res, { message: "Email required." });
      }
      let user2 = await User.findOne({
        email: payload.email.toLowerCase(),
      });
      //   const user = await User.findOne({ phone: payload.phone });
      //   if (user) {
      //     return res.status(404).json({
      //       success: false,
      //       message: "Phone number already exists.",
      //     });
      //   }
      if (user2) {
        return res.status(404).json({
          success: false,
          message: "Email Id already exists.",
        });
      } else {


        let user = new User({
          username: payload?.username,
          email: payload?.email,
          country: payload?.country,
          type: payload?.type,
          phone: payload?.phone,
          rankedDate: new Date(),

        });
        user.password = user.encryptPassword(req.body.password);

        if (payload.uniquecode) {
          let uniqueCode = await RefferelHistory.findOne({ code: payload.uniquecode })
          if (uniqueCode) {
            let refferal = await RefferelCode.findById(uniqueCode.refferal);
            if (refferal) {
              if (refferal.invitee_user && refferal.invitee_user.length > 0) {
                refferal.invitee_user.push(user._id);
              } else {
                refferal.invitee_user = [user._id]
              }
              if (uniqueCode) {
                user.refferal_uniquecode = payload.uniquecode
                // uniqueCode.status = 'Completed';
                uniqueCode.invitee_user = user._id;
                // let inviterUser = await User.findById(uniqueCode.inviter_user);

                // let wallet = {
                //   Bronze: 0,
                //   Silver: 0,
                //   Gold: 0,
                //   Platinam: 0,
                //   Diamond: 0
                // }
                // wallet[refferal.invitee_ticket_type] = refferal.invitee_tickets;
                // user.wallet = wallet
                await uniqueCode.save();
                // if (refferal.inviter_user && refferal.inviter_user.length > 0) {
                //   if (refferal.inviter_user.includes(uniqueCode.inviter_user)) {
                //   } else {
                //     refferal.inviter_user.push(uniqueCode.inviter_user);

                //   }
                // } else {
                //   refferal.inviter_user = [uniqueCode.inviter_user]
                // }
                // await inviterUser.save();
              }
              await refferal.save()
            } else {
              return response.conflict(res, { message: 'Invalid refferal code' });
            }
          } else {
            return res.status(404).json({ success: false, message: 'Invalid refferal code.' });
          }
        }
        await user.save();
        return res.status(200).json({ success: true, data: user });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },

  login: (req, res) => {
    console.log("request came here");
    passport.authenticate("local", async (err, user, info) => {
      if (err) {
        return response.error(res, err);
      }
      if (!user) {
        return response.unAuthorize(res, info);
      }
      let token = await new jwtService().createJwtToken({
        id: user._id,
        // user: user.fullName,
        type: user.type,
        tokenVersion: new Date(),
      });
      if (req.body.player_id) {
        await Device.updateOne(
          { device_token: req.body.device_token },
          { $set: { player_id: req.body.player_id, user: user._id } },
          { upsert: true }
        );
      }
      await user.save();
      let data = {
        token,
        ...user._doc,
      };
      delete data.password;
      return response.ok(res, { ...data });
    })(req, res);
  },

  changePasswordProfile: async (req, res) => {
    try {
      let user = await User.findById(req.user.id);
      if (!user) {
        return response.notFound(res, { message: "User doesn't exists." });
      }
      user.password = user.encryptPassword(req.body.password);
      await user.save();
      //   mailNotification.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed." });
    } catch (error) {
      return response.error(res, error);
    }
  },

  me: async (req, res) => {
    try {
      let user = await User.findOne({ _id: req.user.id }, '-password')
      return response.ok(res, user);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateUser: async (req, res) => {
    try {
      delete req.body.password;
      await User.updateOne({ _id: req.user.id }, { $set: req.body });
      return response.ok(res, { message: "Profile Updated." });
    } catch (error) {
      return response.error(res, error);
    }
  },

  sendOTP: async (req, res) => {
    try {
      const email = req.body.email;
      const user = await User.findOne({ email });

      if (!user) {
        return response.badReq(res, { message: "Email does exist." });
      }
      // OTP is fixed for Now: 0000
      let ran_otp = Math.floor(1000 + Math.random() * 9000);
      await mailNotification.sendOTPmail({
        code: ran_otp,
        email: email
      });
      // let ran_otp = "0000";
      // if (
      //   !ver ||
      //   new Date().getTime() > new Date(ver.expiration_at).getTime()
      // ) {
      let ver = new Verification({
        //email: email,
        user: user._id,
        otp: ran_otp,
        expiration_at: userHelper.getDatewithAddedMinutes(5),
      });
      await ver.save();
      // }
      let token = await userHelper.encode(ver._id);

      return response.ok(res, { message: "OTP sent.", token });
    } catch (error) {
      return response.error(res, error);
    }
  },
  verifyOTP: async (req, res) => {
    try {
      const otp = req.body.otp;
      const token = req.body.token;
      if (!(otp && token)) {
        return response.badReq(res, { message: "otp and token required." });
      }
      let verId = await userHelper.decode(token);
      let ver = await Verification.findById(verId);
      if (
        otp == ver.otp &&
        !ver.verified &&
        new Date().getTime() < new Date(ver.expiration_at).getTime()
      ) {
        let token = await userHelper.encode(
          ver._id + ":" + userHelper.getDatewithAddedMinutes(5).getTime()
        );
        ver.verified = true;
        await ver.save();
        return response.ok(res, { message: "OTP verified", token });
      } else {
        return response.notFound(res, { message: "Invalid OTP" });
      }
    } catch (error) {
      return response.error(res, error);
    }
  },
  changePassword: async (req, res) => {
    try {
      const token = req.body.token;
      const password = req.body.password;
      const data = await userHelper.decode(token);
      const [verID, date] = data.split(":");
      if (new Date().getTime() > new Date(date).getTime()) {
        return response.forbidden(res, { message: "Session expired." });
      }
      let otp = await Verification.findById(verID);
      if (!otp.verified) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      let user = await User.findById(otp.user);
      if (!user) {
        return response.forbidden(res, { message: "unAuthorize" });
      }
      await Verification.findByIdAndDelete(verID);
      user.password = user.encryptPassword(password);
      await user.save();
      //mailNotification.passwordChange({ email: user.email });
      return response.ok(res, { message: "Password changed ! Login now." });
    } catch (error) {
      return response.error(res, error);
    }
  },
  getProfile: async (req, res) => {
    try {
      let id = req.query.userId || req.user.id
      const u = await User.findById(id, '-password');
      return response.ok(res, u);
    } catch (error) {
      return response.error(res, error);
    }
  },
  updateProfile: async (req, res) => {
    const payload = req.body;
    const userId = req?.body?.userId || req.user.id
    try {
      const u = await User.findByIdAndUpdate(
        userId,
        { $set: payload },
        {
          new: true,
          upsert: true,
        }
      );
      let token = await new jwtService().createJwtToken({
        id: u._id,
        type: u.type,
      });
      const data = {
        token,
        ...u._doc,
      };
      delete data.password;
      // await Verification.findOneAndDelete({ phone: payload.phone });
      return response.ok(res, data);
      // }


      // }
    } catch (error) {
      return response.error(res, error);
    }
  },

  fileUpload: async (req, res) => {
    try {
      let key = req.file && req.file.key;
      return response.ok(res, {
        message: "File uploaded.",
        file: `${process.env.ASSET_ROOT}/${key}`,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  fileUploadFromEditor: async (req, res) => {
    try {
      console.log(req.body)
      let key = req.file && req.file.key;
      return response.ok(res, {
        message: "File uploaded.",
        file: `${process.env.ASSET_ROOT}/${key}`,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },


  multifileUpload: async (req, res) => {
    try {
      const files = req.files.map(f => `${process.env.ASSET_ROOT}/${f.key}`)
      return response.ok(res, {
        message: "File uploaded.",
        file: files,
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateWallet: async (req, res) => {
    const payload = req.body;
    const userId = req?.body?.userId || req.user.id


    try {

      let u = await User.findById(userId)
      console.log(u)
      if (u.refferal_uniquecode) {
        let uniqueCode = await RefferelHistory.findOne({ code: u.refferal_uniquecode, status: 'Pending' })
        if (uniqueCode) {
          let refferal = await RefferelCode.findById(uniqueCode.refferal);

          if (refferal && payload[refferal.invitee_ticket_type] >= 10) {
            // if (refferal) {

            uniqueCode.status = 'Completed';
            let inviterUser = await User.findById(uniqueCode.inviter_user);
            let wallet = inviterUser.wallet

            console.log(wallet)
            await uniqueCode.save();
            if (refferal.inviter_user && refferal.inviter_user.length > 0) {
              // if (refferal.inviter_user.includes(uniqueCode.inviter_user)) {
              //   console.log(wallet[refferal.inviter_ticket_type] + refferal.inviter_tickets)
              //   // return response.conflict(res, { message: 'You have already used this refferal code' });
              // } else {
              refferal.inviter_user.push(uniqueCode.inviter_user);
              wallet[refferal.inviter_ticket_type] = wallet[refferal.inviter_ticket_type] + refferal.inviter_tickets;
              // }
            } else {
              refferal.inviter_user = [uniqueCode.inviter_user]
              wallet[refferal.inviter_ticket_type] = wallet[refferal.inviter_ticket_type] + refferal.inviter_tickets;
            }
            inviterUser.wallet = wallet

            console.log(inviterUser)
            // await inviterUser.save();
            await User.findByIdAndUpdate(uniqueCode.inviter_user, inviterUser);
            await refferal.save()
            payload[refferal.invitee_ticket_type] = payload[refferal.invitee_ticket_type] + refferal.invitee_tickets
          }

          // } else {
          //   return response.conflict(res, { message: 'Invalid refferal code' });
          // }
        }
      }

      const data = await User.findByIdAndUpdate(
        userId,
        {
          $inc: {
            'wallet.Bronze': payload.Bronze,
            'wallet.Silver': payload.Silver,
            'wallet.Gold': payload.Gold,
            'wallet.Platinam': payload.Platinam,
            'wallet.Diamond': payload.Diamond,
            'spent_yen': payload.amount,
            'totalspent_yen': payload.amount,
          }
        },
        {
          new: true,
          upsert: true,
        }
      );
      delete data.password;
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateManyusers: async (req, res) => {
    try {
      const payload = {
        rank_type: 'Bronze',
        spent_yen: 0,
        totalspent_yen: 0,
        Bronze: 0,
        Silver: 0,
        Gold: 0,
        Platinam: 0,
        Diamond: 0,
        wallet: {
          Bronze: 0,
          Silver: 0,
          Gold: 0,
          Platinam: 0,
          Diamond: 0
        },
        rankedDate: new Date()
      }
      const user = await User.updateMany({}, payload);
      return response.ok(res, {
        message: "File uploaded.",
      });
    } catch (error) {
      return response.error(res, error);
    }
  },

  testNotification: async (req, res) => {
    try {
      await notify(
        ['67b57b9a02f27d1d0ee1531b'],
        "MylodgeApp",
        'Welcome to the MyLodge App'
      )
      return response.ok(res, { message: 'Notification sent' });
    } catch (error) {
      return response.error(res, error);
    }
  },


  getAllUserForAdmin: async (req, res) => {
    try {
      // console.log(req.query)
      const cond = {
        type: 'USER'
      }
      if (req.query.key) {
        cond['$or'] = [
          { username: { $regex: req.query.key, $options: "i" } },
          { email: { $regex: req.query.key, $options: "i" } },
          { phone: { $regex: req.query.key, $options: "i" } },
          { rank_type: { $regex: req.query.key, $options: "i" } },
        ]
      }
      const { page = 1, limit = 20 } = req.query;
      let users = await User.find(cond, '-password')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalItems = await User.countDocuments(cond);
      const totalPages = Math.ceil(totalItems / limit);
      const data = {
        users,
        pagination: {
          totalItems,
          totalPages,
          currentPage: page,
          itemsPerPage: limit,
        },
      }
      return response.ok(res, data);
    } catch (error) {
      return response.error(res, error);
    }
  },

};

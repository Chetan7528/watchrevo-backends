"use strict";
const response = require("./../responses");
const mongoose = require("mongoose");
const Setting = mongoose.model("Setting");

module.exports = {
  createSetting: async (req, res) => {
    try {
      const payload = req.body;

      let savedata = new Setting(payload);
      await savedata.save();
      res.status(200).json({ success: true, data: savedata });

    } catch (error) {
      return response.error(res, error);
    }
  },
  getSetting: async (req, res) => {
    try {

      let savedata = await Setting.find();
      return response.ok(res, savedata);

    } catch (error) {
      return response.error(res, error);
    }
  },
  updateSetting: async (req, res) => {
    try {
      const payload = req?.body || {};
      let product = await Setting.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteAllSetting: async (req, res) => {
    try {
      await Setting.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
}
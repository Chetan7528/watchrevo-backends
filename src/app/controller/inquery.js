const mongoose = require("mongoose");
const Inquery = mongoose.model('Inquery');
const response = require("./../responses");
const { inquirymail } = require("../services/mailNotification");

module.exports = {

    createInquery: async (req, res) => {
        try {
            const payload = req?.body || {};
            payload.posted_by = req.user.id;
            let cat = new Inquery(payload);
            await cat.save();
            await inquirymail(cat)
            return response.ok(res, { message: 'Inquery added successfully' });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getInquery: async (req, res) => {
        try {
            let data = await Inquery.find();
            return response.ok(res, data);
        } catch (error) {
            return response.error(res, error);
        }
    },
    getInquerybyuser: async (req, res) => {
        try {
            let data = await Inquery.find({ posted_by: req.user.id });
            return response.ok(res, data);
        } catch (error) {
            return response.error(res, error);
        }
    },
}
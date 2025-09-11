const mongoose = require("mongoose");
const RefferelHistory = mongoose.model("RefferelHistory");
const response = require("./../responses");
const ShortUniqueId = require("short-unique-id");


module.exports = {
    createRefferalHistory: async (req, res) => {
        try {
            const payload = req?.body || {};
            const { randomUUID } = new ShortUniqueId({ length: 10 });
            payload.inviter_user = req.user.id;
            payload.code = randomUUID()
            let history = new RefferelHistory(payload);
            await history.save();
            return response.ok(res, history);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getRefferalHistorByRefferCodeID: async (req, res) => {
        try {
            const { page = 1, limit = 20 } = req.query;
            let cond = {
                refferal: req.params.refferID
            }
            let history = await RefferelHistory.find(cond).populate('invitee_user inviter_user', 'username phone email').populate('refferal', 'name')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const totalItems = await RefferelHistory.countDocuments(cond);
            const totalPages = Math.ceil(totalItems / limit);
            const data = {
                history: history,
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
}
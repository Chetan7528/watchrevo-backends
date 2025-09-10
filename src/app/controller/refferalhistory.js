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
}

const reviews = require("../model/reviews");
const response = require("./../responses");


module.exports = {

    createReview: async (req, res) => {
        try {
            const review = new reviews(req.body);
            await review.save();
            return response.ok(res, review)
        } catch (error) {
            return response.error(res, error)
        }
    },

    giverate: async (req, res) => {
        console.log(req.body);
        try {
            let payload = req.body;
            let cond = {
                posted_by: req.user.id,
            }
            //   if(payload.seller){
            //     cond.seller=payload.seller
            //   }else{
            cond.product = payload.product
            //   }
            const re = await reviews.findOne(cond);

            if (re) {
                re.description = payload.description;
                re.rating = payload.rating;
                await re.save();
            } else {
                payload.posted_by = req.user.id;
                const u = new reviews(payload);
                await u.save();
            }

            return response.ok(res, { message: "successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getAllReview: async (req, res) => {
        try {
            const review = await reviews.find().populate("user").populate("product");
            console.log(review);
            return response.ok(res, review)
        } catch (error) {
            return response.error(res, error)
        }
    }
}
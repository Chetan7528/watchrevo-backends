const mongoose = require("mongoose");
const RefferelCode = mongoose.model("RefferelCode");
const response = require("./../responses");



module.exports = {

    createRefferelCode: async (req, res) => {
        try {
            const payload = req?.body || {};
            // payload.posted_by = req.user.id;
            let cat = new RefferelCode(payload);
            // let newName = cat.name.replaceAll(`"`, '') + '_' + cat._id.toString().replace(/[0-9&., ]/g, '');
            // cat.slug = newName.toLowerCase().replace(/[0-9&., ]/g, '_');
            await cat.save();
            return response.ok(res, { message: 'RefferelCode added successfully' });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getRefferelCode: async (req, res) => {
        try {
            const cond = {}
            if (req.query.status) {
                cond.status = 'Active'
            }
            let category = await RefferelCode.find(cond);
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

    // updateAllRefferelCode: async (req, res) => {
    //     try {

    //         let allproducts = await RefferelCode.find({}, 'name slug');
    //         console.log(allproducts)
    //         return response.ok(res, { allproducts });
    //     } catch (error) {
    //         return response.error(res, error);
    //     }
    // },

    getRefferelCodeById: async (req, res) => {
        try {
            let category = await RefferelCode.findById(req?.params?.id);
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

    updateRefferelCode: async (req, res) => {
        try {
            const payload = req?.body || {};
            let category = await RefferelCode.findByIdAndUpdate(payload?.id, payload, {
                new: true,
                upsert: true,
            });
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

    deleteRefferelCode: async (req, res) => {
        try {
            await RefferelCode.findByIdAndDelete(req?.params?.id);
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    deleteAllRefferelCode: async (req, res) => {
        try {
            const newid = req.body.category.map(f => new mongoose.Types.ObjectId(f))
            await RefferelCode.deleteMany({ _id: { $in: newid } });
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    deleteAllNullRefferelCode: async (req, res) => {
        try {

            await RefferelCode.deleteMany({ _id: null });
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getPopularRefferelCode: async (req, res) => {

        try {
            let query = {}
            // if (req.query.pincode) {
            //     query.price_slot = { $elemMatch: { pincode: req.query.pincode } }
            // }
            let category = await RefferelCode.aggregate([
                // {
                //     $match: { popular: true }
                // },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'products',
                        pipeline: [
                            // {
                            //     $match: query
                            // },
                            {
                                $limit: 3
                            },
                            // {
                            //     $project: {
                            //         "varients": { $arrayElemAt: ["$varients.image", 0] },
                            //     }
                            // },
                            // {
                            //     $project: {
                            //         "image": { $arrayElemAt: ["$varients", 0] },
                            //     }
                            // }
                        ]
                    }
                },
                {
                    $project: {
                        "name": 1,
                        "image": 1,
                        "products": 1,
                        "slug": 1
                    }
                },
                // {
                //     $limit: 3
                // },
            ]);
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

};
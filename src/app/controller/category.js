const mongoose = require("mongoose");
const Category = mongoose.model("Category");
const response = require("./../responses");
const mailNotification = require("../services/mailNotification");



module.exports = {

    createCategory: async (req, res) => {
        try {
            const payload = req?.body || {};
            // payload.posted_by = req.user.id;
            let cat = new Category(payload);
            // let newName = cat.name.replaceAll(`"`, '') + '_' + cat._id.toString().replace(/[0-9&., ]/g, '');
            // cat.slug = newName.toLowerCase().replace(/[0-9&., ]/g, '_');
            await cat.save();
            return response.ok(res, { message: 'Category added successfully' });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getCategory: async (req, res) => {
        try {
            const cond = {}
            if (req.query.status) {
                cond.status = 'Active'
            }
            let category = await Category.find(cond);
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

    // updateAllCategory: async (req, res) => {
    //     try {

    //         let allproducts = await Category.find({}, 'name slug');
    //         console.log(allproducts)
    //         return response.ok(res, { allproducts });
    //     } catch (error) {
    //         return response.error(res, error);
    //     }
    // },

    getCategoryById: async (req, res) => {
        try {
            let category = await Category.findById(req?.params?.id);
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

    updateCategory: async (req, res) => {
        try {
            const payload = req?.body || {};
            let category = await Category.findByIdAndUpdate(payload?.id, payload, {
                new: true,
                upsert: true,
            });
            return response.ok(res, category);
        } catch (error) {
            return response.error(res, error);
        }
    },

    deleteCategory: async (req, res) => {
        try {
            await Category.findByIdAndDelete(req?.params?.id);
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    deleteAllCategory: async (req, res) => {
        try {
            const newid = req.body.category.map(f => new mongoose.Types.ObjectId(f))
            await Category.deleteMany({ _id: { $in: newid } });
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    deleteAllNullCategory: async (req, res) => {
        try {

            await Category.deleteMany({ _id: null });
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },
    getPopularCategory: async (req, res) => {

        try {
            let query = {}
            // if (req.query.pincode) {
            //     query.price_slot = { $elemMatch: { pincode: req.query.pincode } }
            // }
            let category = await Category.aggregate([
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
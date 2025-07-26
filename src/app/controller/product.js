const mongoose = require("mongoose");
const Product = mongoose.model("Product");
const Category = mongoose.model("Category");
const response = require("./../responses");
const mailNotification = require("../services/mailNotification");
const { getReview } = require("../helper/user");
const productRequest = require("../model/product-request");
const user = require("../model/user");
const review = mongoose.model("review");
const Notification = mongoose.model("Notification");
const moment = require("moment");

const rankData = {
  'Bronze': 10000,
  'Silver': 100000,
  'Gold': 1000000,
  'Platinam': 5000000,
}

const nextRank = {
  'Bronze': 'Silver',
  'Silver': 'Gold',
  'Gold': 'Platinam',
  'Platinam': 'Diamond',
}

const maxRankData = {
  'Silver': 20000,
  'Gold': 100000,
  'Platinam': 500000,
  "Diamond": 5000000
}

const prevRank = {
  'Silver': 'Bronze',
  'Gold': 'Silver',
  'Platinam': 'Gold',
  'Diamond': 'Platinam',
}

module.exports = {
  createProduct: async (req, res) => {
    try {
      const payload = req?.body || {};
      let cat = new Product(payload);
      await cat.save();
      await Notification.create({
        notification: 'New product is created by WatchRevo',
        users_type: 'All',
        product: cat._id,
        type: 'product'
      })
      return response.ok(res, { message: "Product added successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProduct: async (req, res) => {
    try {
      // console.log(req.query)
      const { page = 1, limit = 20 } = req.query;
      let product = await Product.find()
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getProductForAdmin: async (req, res) => {
    try {
      // console.log(req.query)
      const cond = {}
      if (req.query.key) {
        cond['$or'] = [
          { name: { $regex: req.query.key, $options: "i" } },
        ]
      }
      const { page = 1, limit = 20 } = req.query;
      let product = await Product.find(cond)
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalItems = await Product.countDocuments(cond);
      const totalPages = Math.ceil(totalItems / limit);
      const data = {
        products: product,
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

  getProductById: async (req, res) => {
    try {
      //   const { page = 1, limit = 8 } = req.query;
      let product = await Product.findById(req?.params?.id).populate(
        "category"
      );
      let Reviews = await review.find({ product: product._id }).populate('user', 'username')
      // .limit(limit * 1)
      // .skip((page - 1) * limit);
      let d = {
        ...product._doc,
        rating: await getReview({ product: product._id }),
        reviews: Reviews,
        // favourite: favourite ? true : false
      }
      return response.ok(res, d);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getProductBycategory: async (req, res) => {
    try {
      const cond = {}
      const cat = await Category.findOne({ name: '' })
      if (req?.params?.id !== 'All') {
        cond.category = req?.params?.id
      } else {
        const cat = await Category.findOne({ name: req.query.cat })
        cond.category = { $ne: cat._id }
      }
      const { page = 1, limit = 20 } = req.query;
      let product = await Product.find(cond)
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },
  getUserFavouriteProduct: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      let product = await Product.find({ favouritelist: { $in: req.user.id } })
        .populate("category")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  updateProduct: async (req, res) => {
    try {
      const payload = req?.body || {};
      let product = await Product.findByIdAndUpdate(payload?.id, payload, {
        new: true,
        upsert: true,
      });
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  deleteProduct: async (req, res) => {
    try {
      await Product.findByIdAndDelete(req?.params?.id);
      return response.ok(res, { meaasge: "Deleted successfully" });
    } catch (error) {
      return response.error(res, error);
    }
  },
  toggleFavourite: async (req, res) => {
    try {
      console.log(req?.params?.id)
      console.log(req?.user?.id)
      let fav = await Product.findById(req?.params?.id);
      const userId = req.user.id;

      const isFavorited = fav.favouritelist.includes(userId);

      if (isFavorited) {
        // Remove from favorites
        fav.favouritelist.pull(userId);
      } else {
        // Add to favorites
        fav.favouritelist.push(userId);
      }
      await fav.save();
      return response.ok(res, fav);
    } catch (error) {
      return response.error(res, error);
    }
  },

  requestProduct: async (req, res) => {
    try {
      const u = await user.findById(req.user.id)
      const payload = req?.body || {}
      // if (Number(u.wallet[u.rank_type]) < Number(payload.total)) {
      //   return response.conflict(res, { message: 'You do not have sufficient tickets' });
      // }
      payload.user = req.user.id
      // payload.order_id = 'ORD-' + moment().format('DDMMYY-HHmmss')
      let cat = new productRequest(payload);
      await cat.save();

      if (payload.shiping_address) {
        u.shiping_address = payload.shiping_address;
        await u.save()
      }
      // u.totalspent_yen = Number(u.totalspent_yen) + Number(payload.total);
      // u.spent_yen = Number(u.spent_yen) + Number(payload.total);
      // u[u.rank_type] = Number(u[u.rank_type]) + Number(payload.total);
      // u.wallet[u.rank_type] = Number(u.wallet[u.rank_type]) - Number(payload.total);
      // console.log(u.wallet)
      // if (u.rank_type !== 'Diamond') {
      //   if (rankData[u.rank_type] < u.spent_yen) {
      //     u.spent_yen = 0
      //     u.rankedDate = new Date()
      //     u.rank_type = nextRank[u.rank_type]
      //   }
      // }
      // await u.save();
      return response.ok(res, { message: 'Order placed successfully' });
    } catch (error) {
      return response.error(res, error);
    }
  },

  productSearch: async (req, res) => {
    try {
      let cond = {
        '$or': [
          { name: { $regex: req.query.key, $options: "i" } },
          // { categoryName: { $regex: req.query.key, $options: "i" } },
        ]
      };
      // let sort_by = {}
      // if (req.query.type) {
      //   cond.type = req.query.type
      // }
      // if (req.query.is_top) {
      //   cond.is_top = true
      // }
      // if (req.query.is_new) {
      //   cond.is_new = true
      // }

      // if (req.query.colors && req.query.colors.length > 0) {
      //   cond.varients = { $ne: [], $elemMatch: { color: { $in: req.query.colors } } }
      // }

      // if (req.query.sort_by) {
      //   if (req.query.sort_by === 'featured' || req.query.sort_by === 'new') {
      //     sort_by.createdAt = -1
      //   }

      //   if (req.query.sort_by === 'old') {
      //     sort_by.createdAt = 1
      //   }

      //   if (req.query.sort_by === 'a_z') {
      //     sort_by.name = 1
      //   }

      //   if (req.query.sort_by === 'z_a') {
      //     sort_by.name = -1
      //   }

      //   if (req.query.sort_by === 'low') {
      //     sort_by.price = 1
      //   }

      //   if (req.query.sort_by === 'high') {
      //     sort_by.price = -1
      //   }
      // } else {
      //   sort_by.createdAt = -1
      // }
      const product = await Product.find(cond).sort({ 'createdAt': -1 });
      // .sort(sort_by).limit(4)
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getOrderBySeller: async (req, res) => {
    try {
      let cond = {

      }
      if (req.body.type) {
        cond.category_type = req.body.type
      }
      if (req.body.curDate) {
        const newEt = new Date(new Date(req.body.curDate).setDate(new Date(req.body.curDate).getDate() + 1))
        cond.createdAt = { $gte: new Date(req.body.curDate), $lte: newEt };
      }
      // if (req.user.type === "SELLER") {
      //   cond = {
      //     productDetail: { $elemMatch: { seller_id: req.user.id } },
      //   }
      // }
      const product = await productRequest.find(cond).populate('user', '-password -varients').populate('productDetail.product').sort({ createdAt: -1 })
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getOrderForAdmin: async (req, res) => {
    try {
      // console.log(req.query)
      const cond = {}
      if (req.query.key) {
        cond['$or'] = [
          { order_id: { $regex: req.query.key, $options: "i" } },
        ]
      }
      if (req.body.type) {
        cond.category_type = req.body.type
      }
      if (req.body.curDate) {
        const newEt = new Date(new Date(req.body.curDate).setDate(new Date(req.body.curDate).getDate() + 1))
        cond.createdAt = { $gte: new Date(req.body.curDate), $lte: newEt };
      }
      console.log(cond)
      const { page = 1, limit = 20 } = req.query;
      let ProductRequest = await productRequest.find(cond)
        .populate('user', '-password -varients').populate('productDetail.product')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalItems = await productRequest.countDocuments(cond);
      console.log(totalItems, 'hhhh')
      const totalPages = Math.ceil(totalItems / limit);
      const data = {
        products: ProductRequest,
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

  getrequestProductbyid: async (req, res) => {
    try {
      const product = await productRequest.findById(req.params.id).populate('user', '-password').populate('productDetail.product')
      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

  getrequestProductbyuser: async (req, res) => {
    try {
      let cond = {
        user: new mongoose.Types.ObjectId(req.user.id)
      }
      if (req.query.type) {
        cond.category_type = req.query.type
      }
      const product = await productRequest.aggregate([
        {
          $match: cond
        },
        {
          $sort: { 'createdAt': -1 }
        },
        {
          $unwind: {
            path: '$productDetail',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'productDetail.product',
            foreignField: '_id',
            as: 'productDetail.product',
            pipeline: [

              {
                $project: {
                  name: 1
                }
              },

            ]
          }
        },
        {
          $unwind: {
            path: '$productDetail.product',
            preserveNullAndEmptyArrays: true
          }
        },

      ])

      return response.ok(res, product);
    } catch (error) {
      return response.error(res, error);
    }
  },

};

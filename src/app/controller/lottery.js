const mongoose = require("mongoose");
const lottery = mongoose.model("lottery");
const response = require("./../responses");
const requestLottery = require("../model/lottery-request");
const user = require("../model/user");
const moment = require("moment");
const { notify } = require("../services/notification");
const User = mongoose.model("User");
const Notification = mongoose.model("Notification");

const rankData = {
    'Bronze': 10000,
    'Silver': 100000,
    'Gold': 1000000,
    'Platinam': 3000000,
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

    createLottery: async (req, res) => {
        try {
            console.log(req.body)
            const Lottery = new lottery(req.body);
            Lottery.slug = 'WRLTRY-' + moment().format('DDMMYY-HHmmss')
            console.log(Lottery)
            await Lottery.save();
            const userList = await User.find({ type: 'USER' })
            await Notification.create({
                users: userList.map(u => u._id),
                notification: 'New lottery is created by WatchRevo',
                users_type: 'USER',
                lottery: Lottery._id,
                type: 'lottery'
            })
            await notify(userList, 'New Lottery', 'New lottery is created by WatchRevo')
            return response.ok(res, Lottery)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getLottery: async (req, res) => {
        try {
            const query = {}
            if (req.query.userid) {
                const user = await User.findById(req.query.userid)
                if (user?.rank_type !== 'Bronzu') {
                    let yearDate = new Date(user?.rankedDate || user?.createdAt).setFullYear(new Date(user?.rankedDate || user?.createdAt).getFullYear() + 1)
                    if (new Date(yearDate) < new Date()) {
                        if (maxRankData[user.rank_type] > user.spent_yen) {
                            user.spent_yen = 0
                            user.rankedDate = new Date()
                            user.rank_type = prevRank[user.rank_type]
                            await user.save()
                        }
                    }
                }
            }
            let cond = {};
            let skip = 0;
            if (req.query.limit) {
                skip = (Number(req.query.page) - 1) * Number(req.query.limit);
            }
            if (req.query.type && req.query.type !== 'all') {
                cond.rank_type = req.query.type
            }
            console.log(req.query)
            const Lottery = await lottery.aggregate([
                {
                    $match: cond
                },
                {
                    $addFields: {
                        sortOrder: {
                            $switch: {
                                branches: [
                                    { case: { $eq: ["$rank_type", "Bronze"] }, then: 1 },
                                    { case: { $eq: ["$rank_type", "Silver"] }, then: 2 },
                                    { case: { $eq: ["$rank_type", "Gold"] }, then: 3 },
                                    { case: { $eq: ["$rank_type", "Platinam"] }, then: 4 },
                                    { case: { $eq: ["$rank_type", "Diamond"] }, then: 5 },
                                ],
                                default: 999
                            }
                        }
                    }
                },
                {
                    $sort: { sortOrder: 1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: Number(req.query.limit) || 10
                }
            ]);



            // const Lottery = await lottery.find();
            return response.ok(res, Lottery)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getAllLottery: async (req, res) => {
        try {
            const Lottery = await lottery.find().populate('prize.product', 'name image').sort({ createdAt: -1 });
            return response.ok(res, Lottery)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getLotteryForAdmin: async (req, res) => {
        try {
            // console.log(req.query)
            const cond = {}
            if (req.query.key) {
                cond['$or'] = [
                    { slug: { $regex: req.query.key, $options: "i" } },
                ]
            }
            const { page = 1, limit = 20 } = req.query;
            let Lottery = await lottery.find(cond)
                .populate('prize.product', 'name image')
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit);

            const totalItems = await lottery.countDocuments(cond);
            const totalPages = Math.ceil(totalItems / limit);
            const data = {
                products: Lottery,
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

    deleteLottery: async (req, res) => {
        try {
            await lottery.findByIdAndDelete(req?.params?.id);
            return response.ok(res, { meaasge: "Deleted successfully" });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getLotteryById: async (req, res) => {
        try {
            let product = await lottery.findById(req?.params?.id).populate('prize.product', 'name image');
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    updateLottery: async (req, res) => {
        try {
            const payload = req?.body || {};
            let product = await lottery.findByIdAndUpdate(payload?.id, payload, {
                new: true,
                upsert: true,
            });
            if (payload.choosewinner) {
                await Promise.all(
                    product.prize.map(async item => {
                        let result = await requestLottery.aggregate([
                            {
                                $match: {
                                    ticketnumber: { $in: item.winnersUser }
                                }
                            },
                            {
                                $project: {
                                    user: 1,
                                    matchingTickets: {
                                        $size: {
                                            $filter: {
                                                input: '$ticketnumber',
                                                as: 'ticket',
                                                cond: { $in: ['$$ticket', item.winnersUser] }
                                            }
                                        }
                                    }
                                }
                            },
                            {
                                $match: {
                                    matchingTickets: { $gt: 0 } // optional, filters users who have at least 1 matching ticket
                                }
                            }
                        ]);
                        result.map(async users => {
                            if (item.type === 'product') {
                                let des = `🎉 Congratulations for winning this round of the lottery no. ${product.slug}! you win ${item.prizeNumber} prize as a ${item.product_name} product. Please update your address if you have not updated. Thank you — better luck next time! 🍀`;
                                await Notification.create({
                                    notification: des,
                                    users_type: 'USER',
                                    lottery: product._id,
                                    type: 'lottery',
                                    users: [users.user]
                                });
                                await notify([users.user], `🏆 We have a Winner!`, des);
                            }

                            if (item.type === 'point') {
                                let des = `🎉 Congratulations for winning this round of the lottery no. ${product.slug}! you win ${item.prizeNumber} prize as a ${product.rank_type} tickets. Your ${users.matchingTickets} ticket number has include in this. Thank you — better luck next time! 🍀`;
                                await Notification.create({
                                    notification: des,
                                    users_type: 'USER',
                                    lottery: product._id,
                                    type: 'lottery',
                                    users: [users.user]
                                });
                                await notify([users.user], `🏆 We have a Winner!`, des);
                                const updateField = `wallet.${product.rank_type}`;
                                console.log(Number(item.point), users.matchingTickets)
                                const totalPoints = Number((Number(item.point) * Number(users.matchingTickets)).toFixed(1))
                                console.log(totalPoints)
                                await User.findByIdAndUpdate(users.user, {
                                    $inc: {
                                        [updateField]: totalPoints
                                    }
                                })
                            }
                        })

                    })



                )
            }
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    requestLottery: async (req, res) => {
        try {
            const payload = req?.body || {}

            const user = await User.findById(req.user.id);
            let product = await lottery.findById(payload?.lottery);
            payload.total = Number(payload.quantity) * Number(product.price)
            console.log(payload.total)
            console.log(Number(user.wallet[product.rank_type]), Number(payload.total))
            if (Number(user.wallet[product.rank_type]) < Number(payload.total)) {
                return response.conflict(res, { message: 'You do not have sufficient tickets' });
            }
            const currentTickets = Number(product.capacity) - Number(product.soldTicket);
            if (Number(currentTickets) < Number(payload.quantity)) {
                return response.conflict(res, { message: `The lottery has only ${currentTickets} tickets. You can't buy more then it.` });
            }

            payload.user = req.user?.id
            // console.log(payload)
            let ticketnumbers = []
            for (i = product.latestTicketNumber; i < product.latestTicketNumber + payload.quantity; i++) {
                let slug = product._id.toString().replace(/[0-9&., ]/g, '')
                let numberT = slug + '_' + (Number(i) + 1)
                ticketnumbers.push(numberT)
            }
            product.latestTicketNumber = (Number(product.latestTicketNumber) + Number(payload.quantity));
            product.soldTicket = Number(product.soldTicket) + Number(payload.quantity)
            await product.save();
            payload.ticketnumber = ticketnumbers;
            let cat = new requestLottery(payload);
            // console.log(cat)
            await cat.save();

            // user.totalspent_yen = Number(user.totalspent_yen) + Number(payload.total);
            // user.spent_yen = Number(user.spent_yen) + Number(payload.total);
            if (user.rank_type !== 'Diamond') {
                if (rankData[user.rank_type] < user.spent_yen) {
                    user.spent_yen = 0
                    user.rankedDate = new Date()
                    user.rank_type = nextRank[user.rank_type]
                }
            }
            user[user.rank_type] = Number(user[user.rank_type]) + Number(payload.total);
            user.wallet[product.rank_type] = Number(user.wallet[product.rank_type]) - Number(payload.total);
            console.log(user)
            if (product.soldTicket === product.capacity) {
                let userList = []
                const allLottery = await requestLottery.find({ lottery: product._id });
                userList = allLottery.map(f => f.user);
                await Notification.create({
                    notification: `${product.slug} lottery tickets have been claimed. Stay tuned for more chances to win!`,
                    users_type: 'USER',
                    lottery: product._id,
                    type: 'lottery',
                    users: userList
                });
                await notify(userList, `${product.slug} lottery ticket Sold Out!`, `${product.slug} lottery tickets have been claimed. Stay tuned for more chances to win!`);
                await Notification.create({
                    notification: `${product.slug} lottery ticket quota met. Check dashboard for participant stats.`,
                    users_type: 'ADMIN',
                    lottery: product._id,
                    type: 'lottery',
                    users: [admin._id]
                });
                const admin = await User.findOne({ type: 'ADMIN' })
                await notify([admin._id], `${product.slug} lottery ticket Sold Out!`, `${product.slug} lottery ticket quota met. Check dashboard for participant stats.`)
            }

            await User.findByIdAndUpdate(req.user.id, user);
            const data = {
                lotteryRequest: cat,
                user
            }
            return response.ok(res, { message: 'Lottery placed successfully', data });
        } catch (error) {
            return response.error(res, error);
        }
    },

    getRequestLottery: async (req, res) => {
        try {
            const Lottery = await requestLottery.find();
            return response.ok(res, Lottery)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getRequestLotteryByUser: async (req, res) => {
        try {
            let Lottery = []
            if (req.query.limit && req.query.page) {
                let skip = (req.query.page - 1) * req.query.limit;
                Lottery = await requestLottery.find({ user: req.user.id }).populate('lottery', 'slug').sort({ createdAt: -1 }).skip(skip).limit(req.query.limit);

            } else {
                Lottery = await requestLottery.find({ user: req.user.id }).populate('lottery', 'slug').sort({ createdAt: -1 });

            }
            return response.ok(res, Lottery)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getRequestLotteryById: async (req, res) => {
        try {
            let product = await requestLottery.find({ lottery: req?.params?.id }).populate('user', 'name phone');
            return response.ok(res, product);
        } catch (error) {
            return response.error(res, error);
        }
    },

    getTicketNumber: async (req, res) => {
        try {
            const Lottery = await requestLottery.aggregate([
                { $match: { lottery: new mongoose.Types.ObjectId(req.params.id) } },
                { $project: { _id: 0, ticketnumber: 1 } }, // Include only ticketnumber and exclude _id
                { $unwind: "$ticketnumber" } // Flatten the ticketnumber array
            ]);;
            return response.ok(res, Lottery)
        } catch (error) {
            return response.error(res, error)
        }
    },


    getLotteryWinnerListByUser: async (req, res) => {
        try {
            const result = await requestLottery.aggregate([
                {
                    $match: { user: new mongoose.Types.ObjectId(req.user.id) }
                },
                {
                    $sort: { 'createdAt': -1 }
                },
                {
                    $lookup: {
                        from: "lotteries", // collection to compare
                        let: { userTickets: "$ticketnumber" },
                        pipeline: [
                            { $unwind: "$prize" }, // unwind to access each prize
                            // {
                            //     $lookup: {
                            //         from: 'products',
                            //         localField: 'prize.product',
                            //         foreignField: '_id',
                            //         as: 'prize.product',
                            //     }
                            // },
                            // { $unwind: "$prize.product" },
                            {
                                $match: {
                                    $expr: {
                                        $gt: [
                                            {
                                                $size: {
                                                    $setIntersection: ["$prize.winnersUser", "$$userTickets"]
                                                }
                                            },
                                            0
                                        ]
                                    }
                                }
                            },

                            {
                                $project: {
                                    _id: 0,
                                    rank_type: 1,
                                    price: 1,
                                    slug: 1,
                                    prize: "$prize",
                                    matchedTickets: {
                                        $setIntersection: ["$prize.winnersUser", "$$userTickets"]
                                    }
                                }
                            }
                        ],
                        as: "matchedPrizes"
                    }
                },
                {
                    $project: {
                        _id: 0,
                        lottery_request_id: '$_id',
                        total: 1,
                        quantity: 1,
                        matchedPrizes: 1,
                        ticket: "$ticketnumber"
                    }
                },
                {
                    $unwind: '$matchedPrizes'
                }
            ]);
            return response.ok(res, result)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getLotteryAllWinners: async (req, res) => {
        try {
            const result = await lottery.aggregate([
                {
                    $sort: { 'createdAt': -1 }
                },
                {
                    $unwind: "$prize"
                },
                {
                    $match: {
                        "prize.type": "product"
                    }
                },
                {
                    $unwind: "$prize.winnersUser"
                },
                {
                    $lookup: {
                        from: "lotteryrequests", // your second collection name
                        let: { winnerUserId: "$prize.winnersUser", lotteryId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$lottery", "$$lotteryId"] },
                                            { $in: ["$$winnerUserId", "$ticketnumber"] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "matchingTickets"
                    }
                },
                {
                    $match: {
                        "matchingTickets.0": { $exists: true }
                    }
                },
                {
                    $project: {
                        prizeNumber: "$prize.prizeNumber",
                        product_image: "$prize.product_image",
                        prizeType: "$prize.type",
                        winnerUser: "$prize.winnersUser",
                        product: "$prize.product",
                        point: "$prize.point",
                        ticketDetails: { $arrayElemAt: ["$matchingTickets", 0] },
                        slug: "$slug"
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ticketDetails.user',
                        foreignField: '_id',
                        as: 'ticketDetails.user',
                    }
                },
                // {
                //     $lookup: {
                //         from: 'products',
                //         localField: 'product',
                //         foreignField: '_id',
                //         as: 'product',
                //     }
                // },
                // {
                //     $unwind: '$product'
                // },
                {
                    $unwind: '$ticketDetails.user'
                },
                {
                    $group: {
                        _id: '$ticketDetails.lottery',
                        data: { "$push": "$$ROOT" },
                        slug: { $first: '$slug' }
                    }
                }
            ]);
            return response.ok(res, result)
        } catch (error) {
            return response.error(res, error)
        }
    },

    getLotteryproductWinners: async (req, res) => {
        try {
            const result = await lottery.aggregate([
                {
                    $match: {
                        "_id": new mongoose.Types.ObjectId(req.params.id)
                    }
                },
                {
                    $sort: { 'createdAt': -1 }
                },
                {
                    $unwind: "$prize"
                },

                {
                    $match: {
                        "prize.type": "product"
                    }
                },
                {
                    $unwind: "$prize.winnersUser"
                },
                {
                    $lookup: {
                        from: "lotteryrequests", // your second collection name
                        let: { winnerUserId: "$prize.winnersUser", lotteryId: "$_id" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$lottery", "$$lotteryId"] },
                                            { $in: ["$$winnerUserId", "$ticketnumber"] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "matchingTickets"
                    }
                },
                {
                    $match: {
                        "matchingTickets.0": { $exists: true }
                    }
                },
                {
                    $project: {
                        prizeNumber: "$prize.prizeNumber",
                        product_image: "$prize.product_image",
                        prizeType: "$prize.type",
                        winnerUser: "$prize.winnersUser",
                        product: "$prize.product",
                        point: "$prize.point",
                        ticketDetails: { $arrayElemAt: ["$matchingTickets", 0] },
                        slug: "$slug"
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'ticketDetails.user',
                        foreignField: '_id',
                        as: 'ticketDetails.user',
                    }
                },
                // {
                //     $lookup: {
                //         from: 'products',
                //         localField: 'product',
                //         foreignField: '_id',
                //         as: 'product',
                //     }
                // },
                // {
                //     $unwind: '$product'
                // },
                {
                    $unwind: '$ticketDetails.user'
                },
                {
                    $group: {
                        _id: '$ticketDetails.lottery',
                        data: { "$push": "$$ROOT" },
                        slug: { $first: '$slug' }
                    }
                }
            ]);
            return response.ok(res, result)
        } catch (error) {
            return response.error(res, error)
        }
    },

    updateManyLottery: async (req, res) => {
        try {
            const payload = {
                soldTicket: 0,
                latestTicketNumber: 0,
            }
            const user = await lottery.updateMany({}, payload);
            return response.ok(res, {
                message: "File uploaded.",
            });
        } catch (error) {
            return response.error(res, error);
        }
    },
}
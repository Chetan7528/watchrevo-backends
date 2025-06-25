'use stric'

const { default: mongoose } = require("mongoose")
const { mongo } = require("mongoose")

const lotterySchema = new mongoose.Schema({
    prize: [
        {
            type: {
                type: String
            },
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            product_name: {
                type: String
            },
            product_image: {
                type: String
            },
            prizeNumber: {
                type: String
            },
            point: {
                type: String
            },
            person: {
                type: String
            },
            winnersUser: [{
                type: String
            }],
        }
    ],
    slug: {
        type: String
    },
    rank_type: {
        type: String
    },
    price: {
        type: Number
    },
    capacity: {
        type: Number
    },
    user_capacity: {
        type: Number
    },
    soldTicket: {
        type: Number,
        default: 0
    },
    latestTicketNumber: {
        type: Number,
        default: 0
    },
},
    { timestamps: true }
)

module.exports = mongoose.model("lottery", lotterySchema);
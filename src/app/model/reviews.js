'use stric'

const { default: mongoose } = require("mongoose")
const { mongo } = require("mongoose")


const reviewsSchema = new mongoose.Schema({
    comment: {
        type: String,
    },
    rating: {
        type: Number,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    }

},
    { timestamps: true }
)

module.exports = mongoose.model("review", reviewsSchema);
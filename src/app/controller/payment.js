// paymentService.js
const Stripe = require("stripe");
const { default: mongoose } = require('mongoose');

const User = mongoose.model("User");

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_API_SECRET_KEY);



const response = require("./../responses");
const { default: axios } = require('axios');



function parseResponse(responseString) {
    return Object.fromEntries(new URLSearchParams(responseString));
}

const initiatePayment = async (req, res) => {
    try {

        const { orderID, amount, token } = req.body;
        console.log(req.body)

        const params = new URLSearchParams({
            ShopID: process.env.SHOP_ID,
            ShopPass: process.env.SHOP_PASSWORD,
            OrderID: orderID,
            JobCd: 'CAPTURE',
            Amount: amount.toString(),
        });

        const responses = await axios.post(
            process.env.GMOENTRYURL,
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        console.log(responses)
        const entryRes = parseResponse(responses.data)
        console.log(entryRes)
        if (entryRes.AccessID) {
            const param = new URLSearchParams({
                AccessID: entryRes.AccessID,
                AccessPass: entryRes.AccessPass,
                OrderID: orderID,
                Method: '1', // Lump-sum
                Token: token,
            });
            console.log(param)
            const ExecTranresponses = await axios.post(
                process.env.GMOEXCURL,
                param,
                { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
            );
            const execRes = parseResponse(ExecTranresponses.data)
            console.log(execRes)
            if (execRes.OrderID) {
                return response.ok(res, execRes);
            } else {
                return response.error(res, { message: 'Payment failed. Please try again' });
            }
        } else {
            return response.error(res, { message: 'Payment failed. Please try again' });
        }
    } catch (error) {
        return response.error(res, error);
    }
}

const executePayment = async (req, res) => {
    try {
        const { accessID, accessPass, orderID, token } = req.body;

        const params = new URLSearchParams({
            AccessID: accessID,
            AccessPass: accessPass,
            OrderID: orderID,
            Method: '1', // Lump-sum
            Token: token,
        });

        const responses = await axios.post(
            'https://pt01.mul-pay.jp/payment/ExecTran.idPass',
            params,
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const execRes = parseResponse(responses.data)
        return response.ok(res, execRes);
    } catch (error) {
        return response.error(res, error);
    }
}

const poststripe = async (req, res) => {
    try {
        // let user = await User.findById(req.body.userid)
        // if (!user.payment_customer_id) {
        //     const customer = await stripe.customers.create({
        //         name: user.fullName,
        //         email: user.email,
        //     });
        //     user.payment_customer_id = customer.id
        //     await user.save()
        // }
        // const ephemeralKey = await stripe.ephemeralKeys.create(
        //     { customer: user.payment_customer_id },
        //     { apiVersion: '2024-04-10' } // use latest API version
        // );

        // console.log(ephemeralKey)
        const shipping = req.body.shipping
        let payment_method_types = req.body.paymentMathod || ['card']
        const priceFormatStripe = Math.round(req.body.price);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: priceFormatStripe,
            currency: req.body.currency,
            automatic_payment_methods: {
                enabled: true,
            },
            // payment_method_types,
            // shipping
        });

        res.status(200).send({
            paymentIntent,
            // ephemeralKey
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, error: err.message });
    }
}

module.exports = { initiatePayment, executePayment, poststripe };

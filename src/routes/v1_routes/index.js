"use strict";
const router = require("express").Router();
const { default: mongoose } = require("mongoose");
const isAuthenticated = require("./../../middlewares/isAuthenticated");
const user = require("../../app/controller/user");
const setting = require("../../app/controller/setting");
const inquery = require("../../app/controller/inquery");
const category = require("../../app/controller/category");
const product = require("../../app/controller/product");
// const notification = require("../../app/controller/notification");
const { upload } = require("../../app/services/fileUpload");
const review = require("./../../app/controller/review");
const lottery = require("../../app/controller/lottery");
const notification = require("../../app/controller/notification");
const content = require("../../app/controller/content");

const payment = require("../../app/controller/payment");
const refferelcode = require("../../app/controller/refferelcode");
const refferalhistory = require("../../app/controller/refferalhistory");

router.get("/testNotification", user.testNotification);
router.post("/signup", user.signUp);
router.post("/login", user.login);
router.get("/profile", isAuthenticated(['ADMIN', "USER"]), user.me);
router.post("/updateprofile", isAuthenticated(['ADMIN', "USER"]), user.updateUser);
router.post("/sendotp", user.sendOTP);
router.post("/verifyotp", user.verifyOTP);
router.post("/changepassword", user.changePassword);
router.post("/changepasswordfromprofile", isAuthenticated(['ADMIN', "USER"]), user.changePasswordProfile);
router.post(
    "/user/fileupload",
    upload.single("file"),
    user.fileUpload
);

router.get(
    "/getAllUserForAdmin",
    isAuthenticated(["ADMIN"]),
    user.getAllUserForAdmin
);
// router.get('/updatemanyuser', user.updateManyusers)  // reset all user data === danzer zone
// router.get('/updatemanyLottery', lottery.updateManyLottery)  // reset all lattery data === danzer zone

router.post(
    "/fileupload",
    upload.single("file"),
    // upload.array("file", 10),
    user.fileUploadFromEditor
);

router.post(
    "/imageupload",
    upload.array("files", 10),
    user.multifileUpload
);
router.get("/getProfile", isAuthenticated(["USER", "ADMIN"]), user.getProfile);
router.post("/updateProfile", isAuthenticated(["USER", "ADMIN"]), user.updateProfile);
router.post("/updateWallet", isAuthenticated(["USER", "ADMIN"]), user.updateWallet);

//setting
router.post("/createSetting", setting.createSetting);
router.get("/getSetting", setting.getSetting);
router.post("/updateSetting", setting.updateSetting);
router.delete("/deleteAllSetting/:id", setting.deleteAllSetting);

///Inqury
router.post("/createInquery", isAuthenticated(['ADMIN', "USER"]), inquery.createInquery);
router.get("/getInquery", inquery.getInquery);
router.get("/getInquerybyuser", isAuthenticated(['ADMIN', "USER"]), inquery.getInquerybyuser);


// //Refferelcode
router.post("/createRefferelCode", refferelcode.createRefferelCode);
router.get("/getRefferelCode", refferelcode.getRefferelCode);
router.get("/getRefferelCode/:id", refferelcode.getRefferelCodeById);
router.post("/updateRefferelCode", isAuthenticated(['ADMIN', "USER"]), refferelcode.updateRefferelCode);
router.delete("/deleteRefferelCode/:id", refferelcode.deleteRefferelCode);
router.get("/deleteAllNullRefferelCode", refferelcode.deleteAllNullRefferelCode);

//category
router.post("/createCategory", category.createCategory);
router.get("/getCategory", category.getCategory);
router.post("/updateCategory", category.updateCategory);
router.delete("/deleteCategory/:id", category.deleteCategory);
router.get("/deleteAllNullCategory", category.deleteAllNullCategory);

///product
router.post("/createProduct", product.createProduct);
router.get("/getProduct", product.getProduct);
router.get("/getProductForAdmin", product.getProductForAdmin);
router.get("/getProductBycategory/:id", product.getProductBycategory);
router.post("/updateProduct", product.updateProduct);
router.get("/getProductById/:id", product.getProductById);
router.delete("/deleteProduct/:id", product.deleteProduct);
router.get("/toggleFavourite/:id", isAuthenticated(['ADMIN', "USER"]), product.toggleFavourite);
router.get("/getFavouriteProduct", isAuthenticated(['ADMIN', "USER"]), product.getUserFavouriteProduct);
router.get("/productsearch", product.productSearch);

router.post("/getOrderBySeller", isAuthenticated(["USER", "ADMIN", "SELLER"]), product.getOrderBySeller);
router.post("/getOrderForAdmin", isAuthenticated(["USER", "ADMIN", "SELLER"]), product.getOrderForAdmin);
router.get("/getProductRequest/:id", isAuthenticated(["USER", "ADMIN", "SELLER"]), product.getrequestProductbyid);
router.get("/getProductRequestbyUser", isAuthenticated(["USER", "ADMIN", "SELLER"]), product.getrequestProductbyuser);
// product request
router.post("/createProductRquest", isAuthenticated(["USER", "ADMIN", "SELLER"]), product.requestProduct);

///Review
router.post("/createReview", review.createReview)
router.get("/getAllReview", review.getAllReview)
router.post("/giverate", isAuthenticated(["USER", "ADMIN", "SELLER"]), review.giverate);

///lottery
router.post("/createLottery", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.createLottery)
router.get("/getLottery", lottery.getLottery)
router.get("/getLotteryForAdmin", lottery.getLotteryForAdmin)
router.get("/getAllLottery", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.getAllLottery)
router.delete("/deleteLottery/:id", lottery.deleteLottery);
router.get("/getLotteryById/:id", lottery.getLotteryById);
router.post("/updateLottery", lottery.updateLottery);

// lottery request
router.post("/requestLottery", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.requestLottery);
router.get("/getRequestLottery", lottery.getRequestLottery);
router.get("/getRequestLotteryByUser", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.getRequestLotteryByUser);
router.get("/getRequestLotteryById/:id", lottery.getRequestLotteryById);
router.get("/getTicketNumber/:id", lottery.getTicketNumber);
router.get("/getLotteryWinnerListByUser", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.getLotteryWinnerListByUser);
router.get("/getLotteryAllWinners", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.getLotteryAllWinners);
// router.get("/getLotteryproductWinners/:id", isAuthenticated(["USER", "ADMIN", "SELLER"]), lottery.getLotteryproductWinners);
router.get('/getLotteryproductWinners/:id', isAuthenticated(["ADMIN"]), lottery.getLotteryproductWinners)

//Notification

router.post("/notification/create", isAuthenticated(["USER", "ADMIN", "SELLER"]), notification.create);
// router.get("/notification/create", isAuthenticated(["USER", "ADMIN", "SELLER"]), notification.getNoti);
router.get("/getNotification", isAuthenticated(["USER", "ADMIN", "SELLER"]), notification.getNotification);

//content
router.post("/content", isAuthenticated(["ADMIN"]), content.create);
router.get("/content", content.getContent);


//payment
router.post('/initiatePayment', payment.initiatePayment)
router.post('/executePayment', payment.executePayment)
router.post('/initiatestripe', payment.poststripe)

//refferal
router.post('/refferalcreate', isAuthenticated(["ADMIN", "USER"]), refferalhistory.createRefferalHistory)
router.get('/getRefferalHistorByRefferCodeID/:refferID', isAuthenticated(["ADMIN"]), refferalhistory.getRefferalHistorByRefferCodeID)
module.exports = router;

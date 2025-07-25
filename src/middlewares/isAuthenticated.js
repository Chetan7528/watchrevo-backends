const passport = require("passport");
const response = require("./../app/responses");
const mongoose = require("mongoose");
const User = mongoose.model("User");
module.exports = (role = []) => {
  return (req, res, next) => {
    passport.authenticate(
      "jwt",
      { session: false },
      async function (err, user, info) {
        if (err) {
          return response.error(res, err);
        }
        // console.log("user--------->", user);
        if (!user) {
          return response.unAuthorize(res, info);
        }
        if (role.indexOf(user.type) == -1) {
          return response.unAuthorize(res, { message: "Invalid login" });
        }
        req.user = user;
        next();
      }
    )(req, res, next);
  };
};

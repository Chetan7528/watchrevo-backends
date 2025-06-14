const OneSignal = require("@onesignal/node-onesignal");
const mongoose = require("mongoose");
const Device = mongoose.model("Device");
const Notification = mongoose.model("Notification");
const User = mongoose.model("User");
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;

// const ONESIGNAL_AUTH_KEY = {
//   getToken() {
//     return process.env.ONESIGNAL_AUTH_KEY;
//   }
// };
const ONESIGNAL_REST_API_KEY = {
  getToken() {
    return process.env.ONESIGNAL_REST_API_KEY;
  }
};
const configuration = OneSignal.createConfiguration({
  // userKey: process.env.ONESIGNAL_APP_ID,
  // appKey: process.env.ONESIGNAL_REST_API_KEY,
  // userAuthKey: process.env.ONESIGNAL_AUTH_KEY,
  restApiKey: process.env.ONESIGNAL_REST_API_KEY,
  authMethods: {
    // user_auth_key: { tokenProvider: ONESIGNAL_AUTH_KEY },
    rest_api_key: { tokenProvider: ONESIGNAL_REST_API_KEY }
  }
});
const client = new OneSignal.DefaultApi(configuration);

async function sendNotification(content, player_ids, title) {
  try {
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.include_subscription_ids = player_ids;
    notification.contents = {
      en: content,
    };
    if (title) {
      notification.headings = {
        en: title,
      };
    }
    notification.name = "Hiro";
    return await client.createNotification(notification);
  } catch (err) {
    console.log("error in send notification", content);
    console.error("error in send notification", err);
  }
}
async function findDevices(user) {
  const devices = await Device.find({ user });
  return devices.map((d) => d.player_id);
}
// async function findDevices(user) {
//   const devices = await User.find({ _id: user });
//   console.log("devices===========>", devices);
//   return devices.map((d) => d._id);
// }

module.exports = {
  // push: async (user, content, job = null) => {
  //   const player_ids = await findDevices(user);
  //   const poll = await Poll.findById(job).populate('event')
  //   const notObj = { for: user, message: content, title: poll.event.title };
  //   if (job) notObj.invited_for = job;
  //   await Notification.create(notObj);
  //   return sendNotification(content, player_ids, poll.event.title); //pushnotification
  // },
  notify: async (user,  title,content, ride,trips) => {
    const player_ids = await findDevices(user);
    console.log('player_ids====>', player_ids)
    const notObj = { for: user, description: content, title: title };
    if (ride) {
      notObj.ride=ride
    }
    if (trips) {
      notObj.trips=trips
    }
    console.log('notobj',notObj)
    await Notification.create(notObj);
    return sendNotification(content, player_ids, title);
  },
  notifyAllUser: async (users, content, job = null, title) => {
    const user = await User.findOne({ type: "ADMIN" });
    // if (!title) {
    //   const offer = await OFFER.findById(job);
    //   title = offer.offername;
    // }
    const devices = await User.find();
    console.log("devices===========>", devices);
    const player_ids = devices.map((d) => d._id);

    const notObj = { for: player_ids, description: content, title: title };
    if (job) notObj.invited_for = job;
    await Notification.create(notObj);
    // const player_ids = await findDevices(user);
    // console.log('player_ids====>', player_ids)

    return;
    // sendNotification(content, player_ids, title);
  },
};


const async = require('async');
let util = require('../../Utilities/util');
const commonFunction = require('../../commonFile/commonFunction');
const mongoose = require('mongoose');
const _ = require('lodash');
const multiparty = require('multiparty');
const day = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];
/* model start here */

const loginAdmin = require('../../Models/adminModels/userPanelSchema');
const activityModel = require('../../Models/activityModels/activitySchema');
const bookactivityModel = require('../../Models/activityModels/activityBook');
const notificationModel = require('../../Models/adminModels/notificationList');



bookedActivity = (data, header, callback) => {
    let userId;
    commonFunction.jwtDecode(header.accesstoken, (err, succ) => {
        console.log(err, userId)
        if (err) {
            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
            return
        }
        else {
            userId = succ
        }
    })
    if (data.activityId) {
        let temp = {
            activityId: data.activityId,
            userId: userId
        }
        // console.log(temp)
        async.parallel({
            checkActivity: (cb) => {
                temp.BOOKING_TYPE = 'SELF'
                console.log("temp", temp)
                bookactivityModel.findOne(temp).exec((err, succ) => {
                    console.log("========>>>", err, succ)
                    if (err || !succ) {
                        cb(null, null)
                    }
                    else {
                        cb(null, succ)
                    }
                })
            }
        }, (error, response) => {
            // console.log("repsosne", error, response)
            if (response.checkActivity) {
                callback({ "statusCode": util.statusCode.ALREADY_EXIST, "statusMessage": util.statusMessage.ALREADY_BOOKED[data.lang = 'en'] });
            }
            else {
                bookactivityModel.create(temp, (err, succ) => {
                    // console.log(err)
                    let temp = {
                        _id: userId
                    }
                    bookEvent(temp)
                    if (err) {
                        callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
                    }
                    else {
                        callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.BOOKED_ACTIVITY[data.lang = 'en'], result: succ });
                    }
                })
            }
        })

    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
    }
}

giftActivity = (data, header, callback) => {
    console.log(data, header)
    data.lang = 'en'
    let userId;
    if (header.accesstoken) {
        commonFunction.jwtDecode(header.accesstoken, (err, succ) => {
            console.log(err, succ)
            if (err || succ == undefined) {
                callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
                return
            }
            else {
                userId = succ
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
        return
    }

    if (!data.activityId || !data.email) {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] });
    }
    else {
        /* Same email id check */
        loginAdmin.findOne({ _id: userId }).exec((err, result) => {

            if (err || !result) {
                callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.EMAIL_NOT_REGISTERED[data.lang = 'en'] });
                return
            }
            else if (result.email == data.email) {
                callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": "Its your own email" });
                return
            }
            else {
               
                
            }

            async.waterfall([

                function (cb) {
                    let query = {
                        _id: data.activityId,
                    }
                    activityModel.findOne(query).exec((Err, result) => {
                        if (!result) {
                            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.NOT_UPDATE[data.lang = 'en'] });
                            return
                        }
                        cb(null, null)
                    })

                },
                function (d, cb) {
                    loginAdmin.findOne({ email: data.email }).lean(true).exec((err, result) => {

                        if (err || !result) {
                            callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.EMAIL_NOT_REGISTERED[data.lang = 'en'] });
                            return
                        }
                        else {

                            let temp = {
                                activityId: data.activityId,
                                userId: userId,
                                giftedEmail: data.email,
                                BOOKING_TYPE: "GIFTED"
                            }
                            giftedEvent(temp)
                            cb(null, result)
                        }
                    })
                },

                function (result, cb) {
                    let temp = {
                        activityId: data.activityId,
                        userId: userId,
                        giftedEmail: data.email,
                        BOOKING_TYPE: "GIFTED"
                    }
                    bookactivityModel.findOne(temp).exec((err, succ) => {

                        if (err || succ) {
                            callback({ "statusCode": util.statusCode.ALREADY_EXIST, "statusMessage": util.statusMessage.ALREADY_GIFT[data.lang = 'en'] });
                            return
                        }
                        else {

                            cb(null, result)
                        }
                    })
                },
                function (result, cb) {
                    // console.log(result)
                    let temp = {
                        activityId: data.activityId,
                        userId: userId,
                        giftedEmail: data.email,

                        BOOKING_TYPE: "GIFTED"
                    }
                    bookactivityModel.create(temp, (err, succ) => {


                        cb(err, result)
                    })
                }

            ], (err, response) => {
                // console.log("=====sssss==>>>", err, response)
                let temp = response
                delete temp.forgotToken
                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.ACTIVITY_GIFTED[data.lang = 'en'], result: temp });
            })

        })
    }
}


getEventDetails = (data, header, callback) => {
    console.log(data, header)

    // activityModel.aggregate([
    //     {
    //         "$lookup": {
    //             "from": 'activityBook',
    //             "localField": "_id",
    //             "foreignField": "activityId",
    //             "as": "tags"
    //         }
    //     },
    //     {
    //         $match: { 'tags._id': mongoose.Types.ObjectId(data.eventId) }
    //     },


    // ]).exec((err, succ) => {
    //     console.log(err, succ)
    //     callback(succ)
    // })
    // return

    activityModel.findById(data.eventId).lean(true).exec((err, succ) => {
        if (err || !succ) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {

            succ.activityDay = day[new Date(succ.activityDate).getDay()];
            succ.activityImage = succ.image[0].imageURL;
            succ.totalAttender = 0;

            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: succ })
        }
    })
}



module.exports = {

    bookedActivity,
    giftActivity,
    getEventDetails
}

function bookEvent(data) {
    loginAdmin.findOne({ status: 'ACTIVE', _id: data._id }).exec((error, getUser) => {
        console.log('====bookedevent======', getUser)
        if (getUser.deviceType == 'IOS') {
            commonFunction.IOS_NOTIFICATION(getUser.deviceToken, 'BOOK', "you successfully booked event", 'EVENT', 1)
        }
        else {
            commonFunction.android_notification(getUser.deviceToken, 'BOOK', "you successfully booked event", 'EVENT')
        }
    })
}

function giftedEvent(data) {
    /*let temp = {
                    activityId: data.activityId,
                    userId: userId,
                    giftedEmail: data.email,
                    BOOKING_TYPE: "GIFTED"
                } */
    loginAdmin.findOne({ status: 'ACTIVE', email: data.giftedEmail }).exec((error, getUser) => {
        console.log('====bookedevent======', getUser)

        if (getUser.deviceType == 'IOS') {
            commonFunction.IOS_NOTIFICATION(getUser.deviceToken, 'GIFTED', "Received  an event", 'GIFTED', 1)
        }
        else {
            commonFunction.android_notification(getUser.deviceToken, 'GIFTED', "Received an event", 'GIFTED')
        }
        let demo = {
            activityId: data.activityId,
            senderUserId: data.userId,
            receiverUserId: getUser._id,
            BOOKING_TYPE: data.BOOKING_TYPE,
            notificationDate: new Date()
        }
        console.log('new date ---------------->>>>>>>', new Date())
        notificationModel.create(demo, (err, result) => {
            // console.log(err,result,"sumitsumitsumitsumitsumitsumit")
        })
    })


}
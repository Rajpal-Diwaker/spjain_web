
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
const moment = require("moment");
const loginAdmin = require('../../Models/adminModels/userPanelSchema');
const activityModel = require('../../Models/activityModels/activitySchema');
const bookactivityModel = require('../../Models/activityModels/activityBook');
const notificationModel = require('../../Models/adminModels/notificationList');


getAllEvent = (data, header, callback) => {
    console.log(data, header)
    var userId;

    commonFunction.jwtDecode(header.accesstoken, (err, deCode) => {

        if (deCode == undefined) {
            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
            return
        }
        else {
            userId = deCode;
        }
    })
    console.log(userId)
    async.parallel({
        getUserInfo: (cb) => {

            myPointSpent(data, header, (succ) => {
                if (succ.statusCode == 200) {
                    let total = 500 - (succ.pointSpent.upcoming + succ.pointSpent.past)

                    cb(null, total)
                }
                else {
                    cb(null, 500)
                }
            })
        },
        userInfo: (cb) => {
            loginAdmin.findOne({ _id: userId }).exec((err, result) => {
                if (err || !result)
                    cb(null, null)
                else {
                    cb(null, result)
                }
            })
        }
    }, (err, response) => {
        console.log(response)
        // callback(response.getUserInfo)
        // return

        let range = data.range == "MAX" ? 999999 : data.range == "MIN" ? 5 : data.range;
        range = parseInt(range)
        // range = parseInt( )
        var long = parseFloat(data.long ? data.long : 0)
        var lat = parseFloat(data.lat ? data.lat : 0)
        obj = {
            long: long,
            lat: lat
        }
        location = [obj.long, obj.lat]
        radius = 1000 * range
        // console.log(obj, radius)
        let typeOfActivity = [data.eventType]
        if (data.eventType == 'ALL' || data.eventType == undefined)
            typeOfActivity = ['OPTIONAL', 'MANDATORY']

        let query = [
            { $match: { activityDate: { $gte: new Date() } } },
            {
                "$lookup": {
                    "from": 'activityBook',
                    "localField": "_id",
                    "foreignField": "activityId",
                    "as": "tags"
                }
            },
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: location
                    },
                    distanceField: "dist.calculated",
                    maxDistance: radius,
                    query: {},
                    includeLocs: "dist.location",
                    num: 5,
                    spherical: true,
                },
            },
            {
                $match: {
                    $and: [
                        { typeOfActivity: { $in: typeOfActivity } },
                        { program: response.userInfo.program },
                        { status: "ACTIVE" }

                    ]
                }
            },
            { $sort: { activityDate: -1 } }
        ]
        if (data.eventType = "ALL")
            query = [
                
                {
                    $match: {
                        $and: [
                            { activityDate: { $gte: new Date() } },
                            { typeOfActivity: { $in: typeOfActivity } },
                            { program: response.userInfo.program },
                            { status: "ACTIVE" }

                        ]
                    }
                },
                {
                    "$lookup": {
                        "from": 'activityBook',
                        "localField": "_id",
                        "foreignField": "activityId",
                        "as": "tags"
                    }
                },
                { $sort: { activityDate: -1 } }


            ]
        activityModel.aggregate(query).exec((err, succ) => {

            // return
            if (err) {
                callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
            }
            else {

                let optional = [], mandotory = [];

                succ.forEach(element => {

                    // console.log(element.tags.length > 0 ? element.tags[0].BOOKING_TYPE == 'GIFTED' : false)
                    if (element.tags.length > 0) {
                        element.gifted = element.tags.filter(element => {
                            // console.log(element)
                            if (element.BOOKING_TYPE == 'GIFTED' && (element.userId).toString() == userId)
                                return true

                        })
                        element.isBooked = element.tags.filter(element => {
                            // console.log(element)

                            if (element.BOOKING_TYPE == 'SELF' && (element.userId).toString() == userId)
                                return true

                        })
                        element.isBooked = element.isBooked.length > 0 ? "BOOKED" : "NOTBOOKED"
                        element.gifted = element.gifted.length > 0 ? true : false
                    }
                    else {
                        element.isBooked = "NOTBOOKED"
                        element.gifted = false
                    }
                    if (element.typeOfActivity == 'MANDATORY') {
                        // element.isBooked = (element.tags && element.tags.length > 0) ? element.tags[0].BOOKING_TYPE == 'SELF' ? 'BOOKED' : 'NOTBOOKED' : 'NOTBOOKED';
                        // element.gifted = element.tags.length > 0 ? element.tags[0].BOOKING_TYPE == 'GIFTED' : false;
                        element.image = element.image[0].imageURL;
                        element.activityDay = day[new Date(element.activityDate).getDay()];
                        // element.activityDate=day(3);
                        mandotory.push(element);
                    }
                    else {
                        // element.gifted = element.tags.length > 0 ? element.tags[0].BOOKING_TYPE == 'GIFTED' : false;

                        // element.isBooked = (element.tags && element.tags.length > 0) ? element.tags[0].BOOKING_TYPE == 'SELF' ? 'BOOKED' : 'NOTBOOKED' : 'NOTBOOKED';
                        element.image = element.image[0].imageURL;
                        element.activityDay = day[new Date(element.activityDate).getDay()];
                        optional.push(element);
                    }
                })
                let temp = {
                    optional: optional,
                    mandotory: mandotory
                }

                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: temp, userPoint: response.getUserInfo })
            }
        })
    })
}
getMyActivity = (data, header, callback) => {

    console.log(data, header)
    let userId;
    commonFunction.jwtDecode(header.accesstoken, (err, succ) => {
        console.log(err, succ)
        if (err) {
            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
            return
        }
        else {
            userId = succ
        }
    })

    let query = {
        userId: userId,
        BOOKING_TYPE: 'SELF',
        // status: 'ACTIVE'
    }
    bookactivityModel.find(query).populate('userId activityId').sort({ createdAt: -1 }).lean(true).exec(async (err, succ) => {
        // callback(succ)
        // return
        // console.log('========>>>', err, succ)

        if (err || succ == undefined || succ == null || succ.length == 0) {
            callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.NOT_FOUND[data.lang = 'en'], result: {} })
        }
        else {
            var count = 0;
            let MANDATORY = [], OPTIONAL = [];
            // console.log("statr")
            succ.forEach(async element => {


                // let  gifted = succ.filter(el => {
                //     if (el.BOOKING_TYPE == 'GIFTED')
                //         return true
                // })

                //    console.log("=========>>>",gifted,"techugo ",gifted.length)



                // element.gifted = element.BOOKING_TYPE == "GIFTED" ? true : false;
                // console.log(element.BOOKING_TYPE)
                // if (element.BOOKING_TYPE == 'SELF') {
                // console.log(element.BOOKING_TYPE)
                let test = await giftedCount({ activityId: element.activityId._id, userId: userId, BOOKING_TYPE: "GIFTED" })
                // console.log(test)
                element.activityDay = day[new Date(element.activityId.activityDate).getDay()];
                element.activityImage = element.activityId.image[0].imageURL;
                element.activity_id = element.activityId._id;
                element.acitivityName = element.activityId.activityName;
                element.status = element.activityId.status;
                element.startTime = element.activityId.startTime;
                element.endTime = element.activityId.endTime;
                element.location = element.activityId.location;
                element.typeOfActivity = element.activityId.typeOfActivity;
                element.program = element.activityId.program;
                element.creditPoint = element.activityId.creditPoint;
                element.topic = element.activityId.topic;
                element.activityDate = element.activityId.activityDate;
                element.description = element.activityId.description;
                // element.gifted = gifted.length > 0 ? true : false;
                element.canelled = element.activityId.status == "INACTIVE" || element.activityId.status == "CANCELLED" ? true : false;
                element.gifted = test == 0 ? false : true;


                delete element.userId;

                count++

                if (element.activityId.typeOfActivity == "MANDATORY") {
                    delete element.activityId
                    MANDATORY.push(element)
                }
                else {
                    delete element.activityId
                    OPTIONAL.push(element)
                }
                // gifted=[]
                // }

                if (succ.length == count) {
                    result = { MANDATORY: MANDATORY, OPTIONAL: OPTIONAL }
                    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: result })

                }

            });
            // console.log("end")


        }

    })
}


getMyProfile = (data, header, callback) => {
    console.log(data, header)
    var userId;
    commonFunction.jwtDecode(header.accesstoken, (err, deCode) => {
        console.log(deCode, err)
        if (deCode == undefined) {
            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
            return
        }
        else {
            userId = deCode;
        }
    })
    let query = {
        _id: userId
    }
    loginAdmin.findOne(query).lean(true).exec((err, succ) => {
        if (err || !succ) {
            callback({ "statusCode": util.statusCode.BAD_REQUEST, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        }
        else {
            let temp = {
                _id: succ._id,
                firstName: succ.firstName,
                lastName: succ.lastName,
                phone: succ.phone,
                StudentId: succ.StudentId,
                DOB: succ.DOB,
                batchSpecialization: succ.batchSpecialization,
                userType: succ.userType,
                email: succ.email,
                studentPoint: succ.studentPoint ? succ.studentPoint : 500,
                image: succ.image ? succ.image : "",
                age: commonFunction.calculate_age(succ.DOB)
            }
            myPointSpent(data, header, (result) => {
                console.log(result)
                if (result.statusCode == 200) {

                    temp.studentPoint = 500 - (result.pointSpent.upcoming + result.pointSpent.past)
                }
                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: temp })
            })
        }

    })
}


myPointSpent = (data, header, callback) => {

    console.log(data, header)
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
    let query = {
        userId: userId,
        // BOOKING_TYPE: 'SELF',
        status: 'ACTIVE'
    }
    bookactivityModel.find(query).populate('userId activityId').sort({ createdAt: -1 }).lean(true).exec((err, succ) => {
        // console.log(err, succ)
        // callback(succ)

        if (err || succ == undefined || succ == null || succ.length == 0) {
            callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.NOT_FOUND[data.lang = 'en'], err: err, result: {} })
        }
        else {
            let upcoming = [], past = [];
            succ.forEach(element => {
                let gifted = succ.filter(el => {

                    if (el.BOOKING_TYPE == 'GIFTED')
                        return true
                })
                // console.log("===>>", gifted)
                if (element.BOOKING_TYPE == 'SELF') {
                    element.activityDay = day[new Date(element.activityId.activityDate).getDay()];
                    element.activityImage = element.activityId.image[0].imageURL;
                    element.activity_id = element.activityId._id;
                    element.acitivityName = element.activityId.activityName;
                    element.startTime = element.activityId.startTime;
                    element.endTime = element.activityId.endTime;
                    element.location = element.activityId.location;
                    element.typeOfActivity = element.activityId.typeOfActivity;
                    element.program = element.activityId.program;
                    element.description = element.activityId.description;
                    element.creditPoint = element.activityId.creditPoint;
                    element.status = element.activityId.status;
                    element.topic = element.activityId.topic;
                    element.activityDate = element.activityId.activityDate;
                    // element.gifted = element.BOOKING_TYPE == "GIFTED" ? true : false;
                    element.gifted = gifted.length > 0 ? true : false;
                    element.canelled = element.activityId.status == "INACTIVE" || element.activityId.status == "CANCELLED" ? true : false;
                    delete element.userId
                    if (element.activityId.activityDate > new Date()) {
                        delete element.activityId
                        upcoming.push(element)

                    }
                    else {
                        delete element.activityId

                        past.push(element)
                    }
                }
            });
            let pointSpentInUpComing = _.sumBy(upcoming, function (element) {
                if (element.status != 'CANCELLED')
                    return element.creditPoint
                else return 0
            });
            let pointSpentInPassActivity = _.sumBy(past, function (element) {
                if (element.status != 'CANCELLED')
                    return element.creditPoint
                else return 0

            });
            console.log('=====', pointSpentInUpComing)
            let pointSpent = {
                upcoming: pointSpentInUpComing,
                past: pointSpentInPassActivity
            }
            result = { upcoming: upcoming, past: past }
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: result, pointSpent: pointSpent })
        }

    })
}
/* update profile //website  */
editProfile = (data, headers, callback) => {
    console.log("api hitted ")
    var userId
    if (headers.accesstoken) {
        commonFunction.jwtDecode(headers.accesstoken, (err, decodeId) => {
            console.log("^^^^", err, decodeId)
            if (err) throw err
            else {
                userId = decodeId
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        return
    }
    let form = new multiparty.Form();

    form.parse(data, function (err, fields, files) {
        console.log(err, files, fields)

        async.parallel({
            uploadImage: (cb) => {
                if (Object.keys(files).length === 0 && files.constructor === Object) {
                    cb(null, null)
                }
                else {
                    commonFunction.imageUploadToCloudinary(files, (err, image) => {
                        // console.log(err, image)
                        if (err) cb(null)
                        else if (!image) cb(null)
                        else cb(null, image)
                    })
                }
            },
            getUser: (cb) => {
                loginAdmin.findOne({ _id: userId }).exec((err, userinfo) => {
                    // console.log(err, userinfo)
                    if (err) cb(null)
                    else if (!userinfo) cb(null)
                    else cb(null, userinfo)
                })
            }
        }, (err, response) => {
            // console.log("######", err, response)


            if (response.uploadImage) {
                // console.log('33')
            }
            let query = {
                _id: userId
            }
            let update = {
                $set: {
                    image: response.uploadImage ? response.uploadImage : response.getUser.image,
                    firstName: fields.firstName ? fields.firstName[0] : response.getUser.firstName,
                    phone: fields.phone ? fields.phone[0] : response.getUser.phone,
                    lastName: fields.lastName ? fields.lastName[0] : response.getUser.lastName,
                }
            }
            // console.log('@@@@@@@@@@@@@@@2', query, update)

            loginAdmin.findOneAndUpdate(query, update, { new: true }).lean(true).exec((err, success) => {
                // console.log(err, success)
                if (success) {

                    let token = commonFunction.jwtEncode(success._id)
                    success.token = token
                    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.LOGIN_SUCCESS[data.lang = 'en'], "result": success, "accessToken": token });
                } else {
                    callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
                }
            })
        })
    })
}

// calendarView = (data, headers, callback) => {
//     console.log(data, headers)

//     var userId
//     if (headers.accesstoken) {
//         commonFunction.jwtDecode(headers.accesstoken, (err, decodeId) => {
//             console.log("^^^^", err, decodeId)
//             if (err) throw err
//             else {
//                 userId = decodeId
//             }
//         })
//     }
//     else {
//         callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
//         return
//     }
//     console.log(userId)
//     async.parallel({
//         getUserBooking: (cb) => {
//             let query = {
//                 userId: userId
//             }
//             activityModel.aggregate(
//                 [
//                     {
//                         "$lookup": {
//                             "from": 'activityBook',
//                             "localField": "_id",
//                             "foreignField": "activityId",
//                             "as": "tags"
//                         }
//                     }
//                 ]
//             ).exec((err, success) => {
//                 // console.log("===>>", err, success)
//                 cb(err, success)
//             })
//         },
//         getAllEvent: (cb) => {
//             cb(null, null)
//         }
//     }, (err, response) => {

//         let mainArray = []
//         response.getUserBooking.forEach(element => {

//             // element.activityDate = moment(element.activityDate).format("MM/DD/YYYY")

//             // console.log(element.tags[0].activityId, userId)
//             if (element.tags.length > 0 && (element.tags[0].userId).toString() == userId) {
//                 element.booked = "BOOKED"
//             }
//             else {
//                 element.booked = "NOTBOOKED"
//             }
//             delete element.tags;
//             mainArray.push(element)

//         })
//         callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: mainArray })
//     })
// }

notificationList = (data, header, callback) => {

    console.log("api hitted ")
    var userId
    if (header.accesstoken) {
        commonFunction.jwtDecode(header.accesstoken, (err, decodeId) => {
            console.log("^^^^", err, decodeId)
            if (err) throw err
            else {
                userId = decodeId
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        return
    }

    notificationModel.find({ receiverUserId: userId }).populate('activityId senderUserId receiverUserId').lean(true).exec((error, result) => {

        let main = [];
        if (error || result.length == 0) {
            callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.NOT_FOUND[data.lang = 'en'], result: [] })

        }
        else {
            result.forEach(element => {
                let temp = {
                    "_id": element.activityId._id,
                    "image": element.activityId.image[0].imageURL,
                    "notificationTitle": element.BOOKING_TYPE,
                    notificationType: element.activityId.typeOfActivity,
                    "notificationDate": element.createdAt
                }
                main.push(temp)
            })
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.NOTIFICATION_SCREEN[data.lang || 'en'], "result": main });
        }
    })





    return



    let main = [];
    for (let index = 0; index < 4; index++) {
        let temp = {
            "_id": "1234567890",
            image: 'https://res.cloudinary.com/ddbjnqpbw/image/upload/v1565606130/Usmh34HQQOvQblnWmcp6SQ3H.jpg',
            "notificationTitle": "sydney film festival",
            notificationType: "optional",
            "notificationDate": new Date()
        }
        main.push(temp)
    }
    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.NOTIFICATION_SCREEN[data.lang = 'en'], "result": main });
}


//! forgot Password of user
forgotPassword = (data, callback) => {
    console.log("---------->>>", data)
    data.lang = 'en'
    obj = data
    if (!obj) {
        callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
        return
    } else {
        loginAdmin.find({ email: obj.email }, (err, found) => {
            // console.log(err, found)
            if (err) {
                callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang] })
                return
            } else if (!found.length > 0) {
                callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.EMAIL_NOT_REGISTERED[data.lang] })
                return
            } else {
                query = {
                    email: data.email
                }
                var forgotToken = commonFunction.generateToken();
                var update = {
                    "forgotToken": forgotToken
                }
                loginAdmin.findOneAndUpdate(query, update, { new: true }, (err, succ) => {
                    if (err) {
                        callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang] })
                    }
                })
                commonFunction.sendMail(data.email, "FORGOT PASSWORD LINK", forgotToken, (err, res) => {
                    // console.log("WWWWWWWw", err, res)
                    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.EMAIL_SENT[data.lang] })
                });

            }
        })
    }
}

getEventDetails = (data, header, callback) => {

    console.log(data, header)
    var userId;

    commonFunction.jwtDecode(header.accesstoken, (err, deCode) => {
        console.log(deCode, err)
        if (deCode == undefined) {
            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
            return
        }
        else {
            userId = deCode;
        }
    })


    activityModel.findById(data.eventId).lean(true).exec(async (err, succ) => {
        // console.log("err", err, succ)
        if (err || !succ) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {
            // console.log('check')

            let query = {
                activityId: data.eventId,
                userId: userId
            }

            let check = await giftedAndRegister(query)

            if (check.length > 0) {
                let gifted = check.filter(element => {
                    if (element.BOOKING_TYPE == "GIFTED")
                        return true
                })
                let booked = check.filter(element => {
                    if (element.BOOKING_TYPE == "SELF")
                        return true
                })

                succ.gifted = gifted.length > 0 ? true : false;
                succ.isBooked = booked.length > 0 ? "BOOKED" : 'NOTBOOKED'
            }
            else {
                succ.gifted = false;
                succ.isBooked = 'NOTBOOKED'
            }

            succ.canelled = succ.status == "INACTIVE" || succ.status == 'CANCELLED' ? true : false;
            succ.gifted = succ.canelled == true ? true : succ.gifted
            // succ.gifted = (check != null && check.BOOKING_TYPE == 'GIFTED') ? true : false;
            // succ.isBooked = (check != null && check.BOOKING_TYPE == 'SELF') ? 'BOOKED' : 'NOTBOOKED';

            succ.activityDay = day[new Date(succ.activityDate).getDay()];
            succ.activityImage = succ.image[0].imageURL;
            succ.totalAttender = 0;

            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: succ })
        }
    })
}

getEventByDate = (data, header, callback) => {

    console.log(data, header)
    var userId;
    commonFunction.jwtDecode(header.accesstoken, (err, deCode) => {
        console.log(deCode, err)
        if (deCode == undefined) {
            callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
            return
        }
        else {
            userId = deCode;
        }
    })


    // console.log(moment("2019-09-05T06:57:58.000Z").format("YYYY-MM-DD HH:MM:SS"))
    /* new Date(data.activityDate).setDate(new Date(data.activityDate).getDate() + 1) */
    // console.log("=================>>>>>>>>>>>>>>>", new Date(data.activityDate).toISOString())
    // console.log("+=======>>>", new Date(data.activityDate))

    var doo;
    if (data.check == 1) {
        doo =
            { "activityDate": { $gt: new Date(data.activityDate), $lt: new Date(new Date(data.activityDate).setDate(new Date(data.activityDate).getDate() + 1)) } }
    }
    else {
        doo =
            { "activityDate": { $gte: new Date(data.activityDate) } }
    }
    // console.log(doo)
    // console.log(new Date(doo.getTime() + Math.abs(doo.getTimezoneOffset() * 60000)))

    async.parallel({
        getEvent: (cb) => {

            activityModel.aggregate([
                {
                    $match: {
                        $and: [

                            { activityDate: new Date(data.activityDate) }
                            // doo
                        ]
                    }
                },
                {
                    "$lookup": {
                        "from": 'activityBook',
                        "localField": "_id",
                        "foreignField": "activityId",
                        "as": "tags"
                    }
                },
                {
                    $project: {
                        _id: 1,
                        activityName: 1,
                        activityDate: 1,
                        activityendDate: 1,
                        startTime: 1,
                        endTime: 1,
                        status: 1,

                        // ... as you need 
                        useBooked: {
                            $filter: {
                                input: "$tags",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $eq: ["$$item.userId", mongoose.Types.ObjectId(userId)] },

                                    ]
                                }
                            }
                        }
                    }
                }
            ]).exec((err, result) => {
                // console.log(err, result)
                if (err) {
                    callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'], err: err })
                    return
                }
                else {
                    cb(null, result)
                }
            })
        }
    }, (err, response) => {


        if (response.getEvent.length > 0) {

            response.getEvent.forEach(element => {
                // element.isBooked = element.status == "INACTIVE" ? 'CANCELLED':
                if (element.useBooked.length > 0) {

                    element.isBooked = element.useBooked.filter(el => {
                        if (el.BOOKING_TYPE == 'SELF')
                            return true
                    })

                    element.gifted = element.useBooked.filter(el => {
                        if (el.BOOKING_TYPE == 'GIFTED')
                            return true
                    })
                    element.isBooked = element.isBooked.length > 0 ? 'BOOKED' : 'NOTBOOKED';
                    element.gifted = element.gifted.length > 0 ? true : false;

                }
                else {
                    // console.log('asdfasdfas')
                    element.isBooked = 'NOTBOOKED';
                    element.gifted = false;
                }
                delete element.useBooked;
                // console.log("---------->>>",element.status)
                element.canelled = element.status == 'INACTIVE' || element.status == 'CANCELLED' ? true : false;
            })
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: response.getEvent })
            return
        }
        else {
            callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.NOT_FOUND[data.lang = 'en'], result: [] })
            return
        }
    })
}
// not implemented in app side 

calendarView = (data, headers, callback) => {
    console.log(data, headers)

    var userId
    if (headers.accesstoken) {
        commonFunction.jwtDecode(headers.accesstoken, (err, decodeId) => {
            console.log("^^^^", err, decodeId)
            if (err) throw err
            else {
                userId = decodeId
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        return
    }
    console.log(userId)
    async.parallel({
        getUserBooking: (cb) => {
            let query = {
                userId: userId
            }
            activityModel.aggregate(
                [
                    {
                        "$lookup": {
                            "from": 'activityBook',
                            "localField": "_id",
                            "foreignField": "activityId",
                            "as": "tags"
                        }
                    }
                ]
            ).exec((err, success) => {
                // console.log("===>>", err, success)
                cb(err, success)
            })
        },
        getAllEvent: (cb) => {
            cb(null, null)
        }
    }, (err, response) => {
        confirmBooking = 0;
        giftedActivity = 0;
        attendedActivity = 0;
        cancelledActivity = 0;
        let mainArray = []
        response.getUserBooking.forEach(element => {

            // element.activityDate = moment(element.activityDate).format("MM/DD/YYYY")

            // console.log(element.tags[0].activityId, userId)
            if (element.tags.length > 0 && (element.tags[0].userId).toString() == userId) {
                element.booked = "BOOKED"
            }
            else {
                element.booked = "NOTBOOKED"
            }
            delete element.tags;
            mainArray.push(element)
        })
        let temp = {
            confirmBooking: confirmBooking,
            giftedActivity: giftedActivity,
            attendedActivity: attendedActivity,
            cancelledActivity: cancelledActivity,
        }

        callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: mainArray, history: temp })
    })
}
//end here not implemented in app side 

calendarViewAndroid = (data, headers, callback) => {
    console.log(data, headers)

    var userId
    if (headers.accesstoken) {
        commonFunction.jwtDecode(headers.accesstoken, (err, decodeId) => {
            console.log("^^^^", err, decodeId)
            if (err) throw err
            else {
                userId = decodeId
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        return
    }
    console.log(userId)
    async.parallel({
        getUserBooking: (cb) => {

            activityModel.aggregate(
                [
                    {
                        $match: {
                            $and: [

                                { status: { $in: ['ACTIVE', 'CANCELLED'] } }

                            ]
                        }
                    },
                    {
                        "$lookup": {
                            "from": 'activityBook',
                            "localField": "_id",
                            "foreignField": "activityId",
                            "as": "tags"
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            activityName: 1,
                            activityDate: 1,
                            activityendDate: 1,
                            startTime: 1,
                            endTime: 1,
                            status: 1,

                            // ... as you need 
                            useBooked: {
                                $filter: {
                                    input: "$tags",
                                    as: "item",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$item.userId", mongoose.Types.ObjectId(userId)] },

                                        ]
                                    }
                                }
                            }
                        }
                    },
                    { $sort: { activityDate: 1 } }

                ]
            ).exec((err, success) => {
                // // console.log("===>>", err, success)
                // callback(success)
                // return
                cb(err, success)
            })
        },
        getAllEvent: (cb) => {
            cb(null, null)
        }
    }, (err, response) => {
        confirmBooking = 0;
        giftedActivity = 0;
        attendedActivity = 0;
        cancelledActivity = 0;
        let mainArray = []
        response.getUserBooking.forEach(element => {

            // console.log(element)
            element.gifted = element.useBooked.filter(element => {



                if (element.BOOKING_TYPE == 'GIFTED') {

                    return true
                }
            })

            element.isBooked = element.useBooked.filter(element => {
                if (element.BOOKING_TYPE == 'SELF')
                    return true
            })


            confirmBooking = confirmBooking + element.isBooked.length;
            giftedActivity = giftedActivity + element.gifted.length;
            attendedActivity = 0;
            if (element.status == 'CANCELLED') {
                if (element.useBooked.length > 0) {
                    cancelledActivity++;
                }
            }
            element.gifted = element.gifted.length > 0 ? true : false;
            element.isBooked = element.isBooked.length > 0 ? "BOOKED" : 'NOTBOOKED'
            // if(element.)
            element.cancelled = element.status == "INACTIVE" || element.status == "CANCELLED" ? true : false;
            delete element.useBooked
            mainArray.push(element)
        })

        let temp = {
            confirmBooking: confirmBooking,
            giftedActivity: giftedActivity,
            attendedActivity: attendedActivity,
            cancelledActivity: cancelledActivity,
        }

        callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: mainArray, history: temp })
    })
}

newCalendar = (data, headers, callback) => {
    console.log(data, headers)

    var userId
    if (headers.accesstoken) {
        commonFunction.jwtDecode(headers.accesstoken, (err, decodeId) => {
            console.log("^^^^", err, decodeId)
            if (err) throw err
            else {
                userId = decodeId
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        return
    }

    console.log(userId)
    async.parallel({
        getUserBooking: (cb) => {

            activityModel.aggregate(
                [
                    {
                        $match: {
                            $and: [

                                { status: { $in: ['ACTIVE', 'CANCELLED'] } }

                            ]
                        }
                    },
                    {
                        "$lookup": {
                            "from": 'activityBook',
                            "localField": "_id",
                            "foreignField": "activityId",
                            "as": "tags"
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            activityName: 1,
                            activityDate: 1,
                            activityendDate: 1,
                            startTime: 1,
                            endTime: 1,
                            status: 1,
                            month: { $month: '$activityDate' },
                            year: { $year: "$activityDate" },
                            date: { $dayOfMonth: "$activityDate" },
                            // ... as you need 
                            useBooked: {
                                $filter: {
                                    input: "$tags",
                                    as: "item",
                                    cond: {
                                        $and: [
                                            { $eq: ["$$item.userId", mongoose.Types.ObjectId(userId)] },

                                        ]
                                    }
                                }
                            }
                        },

                    },

                    { $match: { month: new Date(data.getDate).getUTCMonth() + 1 } },
                    { $sort: { activityDate: 1 } }

                ]
            ).exec((err, success) => {
                // console.log(err, success)
                cb(err, success)
            })
        },
        getAllEvent: (cb) => {
            cb(null, null)
        }
    }, (err, response) => {
        // console.log(response)

        // console.log("=====", new Date(new Date(data.getDate).setMonth(new Date(data.getDate).getMonth())).getMonth() + 1)

        confirmBooking = 0;
        giftedActivity = 0;
        attendedActivity = 0;
        cancelledActivity = 0;
        let mainArray = []
        response.getUserBooking.forEach(element => {

            // console.log(element)
            element.gifted = element.useBooked.filter(element => {



                if (element.BOOKING_TYPE == 'GIFTED') {

                    return true
                }
            })

            element.isBooked = element.useBooked.filter(element => {
                if (element.BOOKING_TYPE == 'SELF')
                    return true
            })
            element.count = 5
            confirmBooking = confirmBooking + element.isBooked.length;
            giftedActivity = giftedActivity + element.gifted.length;
            attendedActivity = 0;
            if (element.status == 'CANCELLED') {
                if (element.useBooked.length > 0) {
                    cancelledActivity++;
                }
            }
            element.gifted = element.gifted.length > 0 ? true : false;
            element.isBooked = element.isBooked.length > 0 ? "BOOKED" : 'NOTBOOKED'
            // if(element.)
            element.cancelled = element.status == "INACTIVE" || element.status == "CANCELLED" ? true : false;
            delete element.useBooked
            mainArray.push(element)
        })

        let temp = {
            confirmBooking: confirmBooking,
            giftedActivity: giftedActivity,
            attendedActivity: attendedActivity,
            cancelledActivity: cancelledActivity,
        }
        calendarViewAndroid(data, headers, (result) => {


            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.FETCHED_SUCCESSFULLY[data.lang = 'en'], result: mainArray, history: result.history })
        })

    })
}
logout = (data, headers, callback) => {
    console.log(data, headers)

    var userId
    if (headers.accesstoken) {
        commonFunction.jwtDecode(headers.accesstoken, (err, decodeId) => {
            console.log("^^^^", err, decodeId)
            if (err) throw err
            else {
                userId = decodeId
            }
        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang = 'en'] })
        return
    }

    let query = {
        _id: mongoose.Types.ObjectId(userId)
    }
    let update = {
        $set: {
            deviceToken: ''
        }
    }
    loginAdmin.findOneAndUpdate(query, update, { new: true }).exec((error, result) => {
        callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.DEVICE_tOKEN_UPDATE[data.lang || 'en'] })
        return
    })
}
module.exports = {
    getAllEvent,
    getMyProfile,
    getMyActivity,
    myPointSpent,
    editProfile,
    calendarView,
    notificationList,
    forgotPassword,
    getEventDetails,
    getEventByDate,
    calendarViewAndroid,
    newCalendar,
    logout
}

async function giftedAndRegister(data) {
    return new Promise((resolve, reject) => {
        let query = {
            activityId: data.activityId,
            userId: data.userId
        }
        bookactivityModel.find(query).exec((err, success) => {
            if (err) reject(err)
            resolve(success)
        })
    })
}
async function giftedCount(data) {
    return new Promise((resolve, reject) => {
        let query = {
            activityId: data.activityId,
            userId: data.userId,
            BOOKING_TYPE: data.BOOKING_TYPE
        }
        // console.log(query)
        bookactivityModel.find(query).count().exec((err, success) => {
            // console.log("rest", err, success)
            if (err) reject(err)
            resolve(success)
        })
    })
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
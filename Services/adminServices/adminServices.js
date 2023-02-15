
const async = require('async');
let util = require('../../Utilities/util');
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
const moment = require('moment');

const commonFunction = require('../../commonFile/commonFunction');
/* model start here */

const loginAdmin = require('../../Models/adminModels/userPanelSchema');
const activityModel = require('../../Models/activityModels/activitySchema');
const activityBooked = require('../../Models/activityModels/activityBook');


//createVendor
login = (data, callback) => {
    console.log(data)
    obj = data
    var update = {
        deviceToken: data.deviceToken,
        deviceType: data.deviceType,
        lastLogin: moment.utc(),
        // lastLogin: Date.now()
    };

    var query = { email: obj.email, userType: data.userType }
    if (!data) {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang], error: data })
        return
    } else {
        loginAdmin.findOneAndUpdate(query, update).select('firstName paymentAdded isAddressAdded password  lastName email phone address image paymentMethod isBussinessAdded countryCode status userType parentId').lean(true).exec((err, succ) => {
            // console.log(err, succ)
            // console.log('2222222222222222222', succ)
            if (err) {
                callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang] });
                return
            } else if (succ == null) {
                callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.USER_NOT_FOUND[data.lang] });
                return
            } else if (succ.status != 'ACTIVE') {
                callback({ "statusCode": util.statusCode.NOT_FOUND, "statusMessage": util.statusMessage.DELETE_BY_ADMIN[data.lang] });
                return
            }
            else {
                var hash = util.encryptData(data.password);
                if (succ.password == hash) {
                    let token = commonFunction.jwtEncode(succ._id)
                    succ.token = token;

                    loginAdmin.findOneAndUpdate(query, { $set: { jwtToken: token } }).exec((err,result)=>{
                        console.log("=====err",err,result)
                    })
                    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.LOGIN_SUCCESS[data.lang], "result": succ, "accessToken": token });
                } else {
                    callback({ "statusCode": util.statusCode.BAD_REQUEST, "statusMessage": util.statusMessage.INCORRECT_CREDENTIALS[data.lang] });
                }
            }
        })
    }
}

createSubAdmin = (data, callback) => {
    // console.log('create  vendo5r', data)
    // data.email.toLowerCase()
    if (!data.email) {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
        return
    }
    var password = commonFunction.generatePassword()
    async.parallel({
        password: (cb) => {
            cb(null, util.encryptData(password))
        },
        checkuser: (cb) => {
            let query = {
                email: data.email
            }
            loginAdmin.findOne(query).exec((err, result) => {
                console.log('===>', err, result)
                if (err || result == null)
                    cb(null)
                else if (result) {
                    callback({ "statusCode": util.statusCode.ALREADY_EXIST, "statusMessage": util.statusMessage.ALREADY_EXIST[data.lang] })
                    return
                }
            })
        }

    }, (err, response) => {
        var user = new loginAdmin({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: response.password,
            userType: data.userType ? data.userType : 'MANAGEMENT',
            phone: data.phone,
            status: data.status ? data.status : 'active'

        })
        user.save((err, save) => {
            console.log(err, save)
            if (err) {
                callback({ "statusCode": util.statusCode.SOMETHING_WENT_WRONG, "statusMessage": util.statusMessage.SOMETHING_WENT_WRONG[data.lang] })
            } else if (save) {
                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.EMAIL_SENT[data.lang], 'result': save })
                commonFunction.sendMailTest(data.email, "SP JAIN", password, (err, mailsent) => {
                    console.log(err, mailsent)
                })
            }
        })
    })
}


forgotPassword = (data, callback) => {
    console.log("---------->>>", data)
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
                    // log("WWWWWWWw", err, res)
                    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.EMAIL_SENT[data.lang] })
                });

            }
        })
    }
}
createActivity = (data, callback) => {
    console.log(data.files)
    let form = new multiparty.Form();

    form.parse(data, function (err, fields, files) {
        console.log(err, fields, files)

        commonFunction.upload_image_SPJain(files, (result) => {
            // console.log("===>>>", result)
            let image = [];
            result.forEach(element => {
                let temp = {
                    imageURL: element
                }
                image.push(temp)
            })
            let dataToSet = {
                creatorId: fields.adminId ? fields.adminId[0] : null,
                activityName: fields.activityName.length > 0 ? fields.activityName[0] : '',
                'location.coordinates': [fields.lng.length > 0 ? fields.lng[0] : 0, fields.lat.length > 0 ? fields.lat[0] : 0],
                'location.place': fields.location.length > 0 ? fields.location[0] : '',

                activityDate: fields.activityDate.length > 0 ? fields.activityDate[0] : null,
                activityendDate: fields.activityendDate.length > 0 ? fields.activityendDate[0] : new Date(),

                startTime: fields.startTime.length > 0 ? fields.startTime[0] : null,
                endTime: fields.endTime.length > 0 ? fields.endTime[0] : null,
                // phone: fields.phone.length > 0 ? fields.phone[0] : null,
                creditPoint: fields.creditPoint.length > 0 ? fields.creditPoint[0] : '',
                typeOfActivity: fields.typeOfActivity.length > 0 ? fields.typeOfActivity[0] : '',
                program: fields.program.length > 0 ? fields.program[0] : '',
                batchName: fields.batchName.length > 0 ? fields.batchName[0] : '',
                topic: fields.topic.length > 0 ? fields.topic[0] : '',
                description: fields.description.length > 0 ? fields.description[0] : '',
                image: image,
            };
            console.log("----------->>>>", dataToSet)
            console.log("66666666666666666666666666666666666666666666666666666", new Date())
            console.log("----------->>>>", new Date(dataToSet.activityDate))

            activityModel.create(dataToSet, (err, succ) => {
                console.log("eerr,result", err, succ)
                if (err) {
                    callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
                }
                else {

                    sendEventNotification(dataToSet)

                    callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.CREATE_ACTIIVITY[data.lang = 'en'], result: succ })
                }
            })
        })
    })
}

getEventDetails = (data, callback) => {
    activityModel.findById(data.eventId).lean(true).exec(async (err, succ) => {
        let temp = {
            activityId: data.eventId,
            BOOKING_TYPE: "SELF"
        }
        let count = await getLogAttendance(temp)
        succ.count = count
        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: succ })
        }
    })
}

getUserDetails = (data, callback) => {
    loginAdmin.findById(data.studentId, { password: 0 }).exec((err, succ) => {
        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: succ })
        }
    })
}

getAllUser = (data, callback) => {
    console.log(data)
    let query = {
        userType: data.userType
    };
    loginAdmin.find(query, { password: 0 }).sort({ createdAt: -1 }).lean(true).exec((err, succ) => {

        succ.forEach(element => {
            element.age = commonFunction.calculate_age(element.DOB)
            element.status = element.status ? element.status : "ACTIVE"

        })
        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: succ })
        }
    })
}

getAllEvent = (data, callback) => {

    let query = {
        // status: 'ACTIVE'
    }

    let aggregate = [
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
                image: 1,
                status: 1,
                description: 1,
                location: 1,
                typeOfActivity: 1,
                program: 1,
                topic: 1,
                batchName: 1,
                creditPoint: 1,

                // ... as you need 
                useBooked: {
                    $filter: {
                        input: "$tags",
                        as: "item",
                        cond: {
                            $and: [
                                { $eq: ["$$item.BOOKING_TYPE", "SELF"] },

                            ]
                        }
                    }
                }
            }
        },
        { $sort: { activityDate: -1 } }
    ]
    activityModel.aggregate(aggregate).exec((err, succ) => {
        //    callback(succ)
        //     return
        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {

            let optional = [], mandotory = [], cancelled = [];

            succ.forEach(element => {
                element.past = new Date(element.activityDate).getTime() > new Date().getTime()
                if (element.typeOfActivity == 'MANDATORY' && element.status == "ACTIVE") {
                    element.image = element.image[0].imageURL;
                    element.activityDay = day[new Date(element.activityDate).getDay()];
                    // element.activityDate=day(3);

                    mandotory.push(element);
                }
                else if (element.typeOfActivity == 'OPTIONAL' && element.status == "ACTIVE") {
                    element.image = element.image[0].imageURL;
                    element.activityDay = day[new Date(element.activityDate).getDay()];

                    optional.push(element);
                }
                else {
                    element.image = element.image[0].imageURL;
                    element.activityDay = day[new Date(element.activityDate).getDay()];
                    cancelled.push(element);
                }
            })
            let temp = {
                optional: optional,
                mandotory: mandotory,
                cancelled: cancelled
            }
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: temp })
        }
    })
}
calenderView = (data, callback) => {

    let query = {
        // status: 'ACTIVE'
    }
    activityModel.find(query).sort({ activityDate: -1 }).lean(true).exec((err, succ) => {


        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {

            let optional = [], mandotory = [];

            succ.forEach(element => {
                if (element.typeOfActivity == 'MANDATORY') {
                    element.image = element.image[0].imageURL;
                    element.activityDay = day[new Date(element.activityDate).getDay()];
                    // element.activityDate=day(3);

                    mandotory.push(element);
                }
                else {
                    element.image = element.image[0].imageURL;
                    element.activityDay = day[new Date(element.activityDate).getDay()];
                    optional.push(element);
                }
            })
            let temp = {
                optional: optional,
                mandotory: mandotory
            }
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: temp })
        }
    })
}
/*changePassword  */
changePassword = (data, headers, callback) => {
    console.log("change password screen", data, headers)
    async.waterfall([
        function (cb) {
            if (headers.accesstoken) {
                commonFunction.jwtDecode(headers.accesstoken, (err, jwtId) => {
                    console.log(err, jwtId)
                    if (jwtId) {
                        cb(null, jwtId)
                    } else {
                        cb(null, err)
                    }
                })
            } else {
                cb(null, data._id)
            }
        },
        function (jwtId, cb) {
            console.log("################", jwtId)
            // return
            jwtId = jwtId
            /* changing through bug 1 april */
            if (jwtId == undefined) {
                callback({ "statusCode": util.statusCode.BAD_REQUEST, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
                return
            } else {
                loginAdmin.findOne({ _id: mongoose.Types.ObjectId(jwtId) }).exec((err, result) => {
                    if (err) {
                        cb(null)
                    } else if (result.password) {
                        cb(null, jwtId, result.password)
                    } else {
                        callback({ "statusCode": util.statusCode.BAD_REQUEST, "statusMessage": util.statusMessage.USER_LOGIN_SOCIAL[data.lang = 'en'] })
                        return
                    }
                })
            }
        },
        function (jwtId, password, cb) {
            var oldpassword = util.encryptData(data.oldPassword)
            console.log("-=-=-", oldpassword, password)
            if (oldpassword == password) {
                cb(null, jwtId)
            } else {
                callback({ "statusCode": util.statusCode.BAD_REQUEST, "statusMessage": util.statusMessage.INCORRECT_OLD_PASSWORD[data.lang = 'en'] })
                return
            }
        },
        function (jwtId, cb) {
            console.log("########", jwtId, data.newPassword)
            var newpassword = util.encryptData(data.newPassword)
            console.log("33333333333333333333")
            loginAdmin.findOneAndUpdate({ _id: mongoose.Types.ObjectId(jwtId) }, { $set: { password: newpassword } }, { new: true }).exec((err, changePassword) => {
                // console.log("err,password", err, changePassword)
                if (err) cb(null)
                else cb(null, changePassword)
            })
        }
    ], (err, result) => {
        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        } else {
            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.PASSWORD_CHANGED[data.lang = 'en'] })
        }
    })
}

createStudent = (data, callback) => {
    // console.log('create  vendo5r', data)
    // data.email.toLowerCase()
    data.lang = 'en'
    if (!data.email) {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
        return
    }
    var password = commonFunction.generatePassword()
    async.parallel({
        password: (cb) => {
            cb(null, util.encryptData(data.password))
        },
        checkuser: (cb) => {
            let query = {
                email: data.email
            }
            loginAdmin.findOne(query).exec((err, result) => {
                console.log('===>', err, result)
                if (err || result == null)
                    cb(null)
                else if (result) {
                    callback({ "statusCode": util.statusCode.ALREADY_EXIST, "statusMessage": util.statusMessage.ALREADY_EXIST[data.lang] })
                    return
                }
            })
        }

    }, (err, response) => {
        var user = new loginAdmin({
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            password: util.encryptData(data.password),
            userType: data.userType ? data.userType : 'STUDENT',
            phone: data.phone,
            StudentId: data.StudentId,
            DOB: data.DOB,
            batchSpecialization: data.batchSpecialization,
            program: data.program,
            status: data.status ? data.status : 'active'

        })
        commonFunction.sendMailTest(data.email, "SPJAIN login", data.password, (err, result) => {
            console.log(err, result)
        })

        user.save((err, save) => {
            console.log(err, save)
            if (err) {
                callback({ "statusCode": util.statusCode.SOMETHING_WENT_WRONG, "statusMessage": util.statusMessage.SOMETHING_WENT_WRONG[data.lang] })
            } else if (save) {
                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang], 'result': save })
            }
        })
    })
}

deleteActivity = (data, callback) => {
    console.log(data)
    data.lang = 'en'
    if (data.acitivityId || data.status) {
        let query = {
            _id: data.activityId
        }
        let update = {
            $set: {
                status: data.status
            }
        }
        console.log(query, update)
        activityModel.findOneAndUpdate(query, update, { new: true }).exec((err, result) => {
            console.log(err, result)
            if (err) {
                callback({ "statusCode": util.statusCode.SOMETHING_WENT_WRONG, "statusMessage": util.statusMessage.SOMETHING_WENT_WRONG[data.lang], err: err })
            } else {
                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang], 'result': result })
            }

        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
        return
    }
}

editActivity = (data, callback) => {
    // console.log(data)
    let form = new multiparty.Form();

    form.parse(data, function (err, fields, files) {
        console.log('====>>>', err, '====>>>filedds', fields, '==filesss==>>>', files)
        // console.log('-====================================>>', fields.deleteImage[0].split(','))
        // console.log('-====================================>>', fields.deleteImage[0].split(',')[0]=='')
        callback()
        return
        async.parallel({
            deleteData: (cb) => {
                if (fields.deleteImage[0].split(',')[0] != '') {

                    let query = { _id: fields._id.length > 0 ? fields._id[0] : '' };
                    let update = {
                        "$pull": { "image": { "_id": { $in: fields.deleteImage[0].split(',') } } }
                    }
                    console.log("---->>", query, 'asdf', update)
                    activityModel.findOneAndUpdate(query, update, { new: true }).exec((err, succ) => {
                        console.log("====delete query result=====>>>>", err, succ)

                        cb(err, succ)
                    })
                }
                else {
                    cb(null, null)
                }
            },
            updateNewImage: (cb) => {
                if (!_.isEmpty(files)) {
                    commonFunction.upload_image_SPJain(files, (result) => {


                        result.forEach(element => {
                            let temp = {
                                imageURL: element
                            }

                            let query = { _id: fields._id.length > 0 ? fields._id[0] : '' };
                            let update = {
                                "$push": {
                                    "image": temp
                                }
                            }
                            activityModel.findOneAndUpdate(query, update, { new: true }).exec((err, succ) => {


                                cb(err, succ)
                            })

                        });

                    })
                }
                else {
                    cb(null, null)
                }
            }

        }, (err, response) => {

            let query = {
                _id: fields._id.length > 0 ? fields._id[0] : ''
            }
            let dataToSet = {
                $set: {
                    creatorId: fields.adminId ? fields.adminId[0] : null,
                    activityName: fields.activityName.length > 0 ? fields.activityName[0] : '',
                    'location.coordinates': [fields.lng.length > 0 ? fields.lng[0] : 0, fields.lat.length > 0 ? fields.lat[0] : 0],
                    'location.place': fields.location.length > 0 ? fields.location[0] : '',

                    activityDate: fields.activityDate.length > 0 ? fields.activityDate[0] : null,
                    activityendDate: fields.activityendDate.length > 0 ? fields.activityendDate[0] : new Date(),

                    startTime: fields.startTime.length > 0 ? fields.startTime[0] : null,
                    endTime: fields.endTime.length > 0 ? fields.endTime[0] : null,
                    // phone: fields.phone.length > 0 ? fields.phone[0] : null,
                    // creditPoint: fields.creditPoint.length > 0 ? fields.creditPoint[0] : '',
                    // typeOfActivity: fields.typeOfActivity.length > 0 ? fields.typeOfActivity[0] : '',
                    // program: fields.program.length > 0 ? fields.program[0] : '',
                    batchName: fields.batchName.length > 0 ? fields.batchName[0] : '',
                    topic: fields.topic.length > 0 ? fields.topic[0] : '',
                    description: fields.description.length > 0 ? fields.description[0] : ''
                }
            };
            activityModel.findOneAndUpdate(query, dataToSet, { new: true }, (err, succ) => {
                console.log(err, succ)
                if (err) {
                    callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
                }
                else {
                    callback({
                        "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: succ
                    })
                }
            })
        })
    })
}

deleteStudent = (data, callback) => {
    console.log(data)
    data.lang = 'en'
    if (data.studentId || data.status) {
        let query = {
            _id: data.studentId
        }
        let update = {
            $set: {
                status: data.status
            }
        }
        console.log(query, update)
        loginAdmin.findOneAndUpdate(query, update, { new: true }).exec((err, result) => {
            console.log(err, result)
            if (err || !result) {
                callback({ "statusCode": util.statusCode.SOMETHING_WENT_WRONG, "statusMessage": util.statusMessage.SOMETHING_WENT_WRONG[data.lang], err: err })
            } else {
                callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang], 'result': result })
            }

        })
    }
    else {
        callback({ "statusCode": util.statusCode.PARAMETER_IS_MISSING, "statusMessage": util.statusMessage.PARAMS_MISSING[data.lang] })
        return
    }
}

logAttendance = (data, callback) => {

    console.log(data)
    let aggregate = [

        {
            $match: {
                $and: [
                    { _id: mongoose.Types.ObjectId(data.activityId) },
                    // { BOOKING_TYPE: "SELF" }
                ]
            }
        },
        {
            "$lookup": {
                "from": 'adminLogin',
                "localField": "userId",
                "foreignField": "_id",
                "as": "userInfo"
            }
        },
        { $sort: { activityDate: 1 } }
    ]

    let query = { activityId: mongoose.Types.ObjectId(data.activityId), BOOKING_TYPE: "SELF" }
    activityBooked.find(query).populate('userId').exec((err, succ) => {
        // console.log(err)
        // callback(succ)
        // return
        if (err) {
            callback({ "statusCode": util.statusCode.INTERNAL_SERVER_ERROR, "statusMessage": util.statusMessage.SERVER_BUSY[data.lang = 'en'] })
        }
        else {


            callback({ "statusCode": util.statusCode.EVERYTHING_IS_OK, "statusMessage": util.statusMessage.REGISTRATION_DONE[data.lang = 'en'], result: succ })
        }
    })
}
module.exports = {
    login,
    createSubAdmin,
    forgotPassword,
    createActivity,
    getEventDetails,
    getUserDetails,
    getAllUser,
    getAllEvent,
    changePassword,
    createStudent,
    deleteActivity,
    editActivity,
    deleteStudent,
    calenderView,
    logAttendance
}


async function getLogAttendance(data) {
    return new Promise((resolve, reject) => {
        let query = {
            activityId: data.activityId,
            // userId: data.userId,
            BOOKING_TYPE: data.BOOKING_TYPE
        }
        console.log(query)
        activityBooked.find(query).count().exec((err, success) => {
            console.log("rest", err, success)
            if (err) reject(err)
            resolve(success)
        })
    })
}


function sendEventNotification(data) {
    loginAdmin.find({ status: 'ACTIVE', program: data.program }).exec((error, getUser) => {

        getUser.forEach(element => {
            if (element.deviceType == 'IOS') {
                commonFunction.IOS_NOTIFICATION(element.deviceToken, 'NEW EVENT', 'EVENT', 'EVENT', 1)
            }
            else {
                commonFunction.android_notification(element.deviceToken, 'NEW EVENT', 'EVENT', 'EVENT')

            }
        });
    })
}
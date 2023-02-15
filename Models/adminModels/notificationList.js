const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const util = require('../../Utilities/util')
var notification = mongoose.Schema({
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'activitySchema'
    },
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminLogin'
    },
    receiverUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminLogin'
    },
    BOOKING_TYPE: {
        type: String,
        enum: ['GIFTED', 'SELF'],
        default: "GIFTED",
        uppercase: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        default: 'ACTIVE',
        lowercase: false,
        uppercase: true
    },
    notificationDate:{
        type:Date,
        // default:new Date()
    }
}, {
        timestamps: true
    })

module.exports = mongoose.model('notification', notification, 'notification');
// module.exports = activitySchema;
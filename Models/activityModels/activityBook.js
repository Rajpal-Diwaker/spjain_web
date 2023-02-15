const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const util = require('../../Utilities/util')
var activityBook = mongoose.Schema({
    activityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'activitySchema'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminLogin'
    },
    BOOKING_TYPE:{
        type:String,
        enum: ['GIFTED', 'SELF'],
        default:"SELF",
        uppercase:true
    },
    giftedEmail:{
        type:String,
        default:""
    },
    giftedId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminLogin'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
        default: 'ACTIVE',
        lowercase: false,
        uppercase: true
    },
}, {
        timestamps: true
    })
activityBook.plugin(mongoosePaginate);
module.exports = mongoose.model('activityBook', activityBook, 'activityBook');
// module.exports = activitySchema;
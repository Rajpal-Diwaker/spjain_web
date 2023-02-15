const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const util = require('../../Utilities/util')
var activitySchema = mongoose.Schema({
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'adminLogin'
    },
    activityName: {
        type: String,
        require: true,
        trim: true,
        default: ""
    },
    location: {
        place: {
            type: String,
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    activityDate: {
        type: Date,
        require: true,
        default: new Date()
    },
    activityendDate: {
        type: Date,
        // require: true,
        default: new Date()
    },
    startTime: {
        type: String,
        default: ""
    },
    endTime: {
        type: String,
        default: ""
    },
    phone: {
        type: Number,
        default: 0
    },
    creditPoint: {
        type: Number,
        default: 0
    },

    typeOfActivity: {
        type: String,
        enum: ['OPTIONAL', 'MANDATORY'],
        uppercase: true,
        default: 'OPTIONAL'

    },
    program: {
        type: String,
        default: ""
    },
    batchName: {
        type: String,
        default: ""
    },
    topic: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    image: [
        {
            imageURL: String,
            status: {
                type: String,
                enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
                default: 'ACTIVE',
                uppercase: true
            }
        }
    ],
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE', 'CANCELLED', 'DELETED'],
        default: 'ACTIVE',
        lowercase: false,
        uppercase: true
    },
}, {
        timestamps: true
    })

activitySchema.index({ 'location.coordinates': '2dsphere' });

// activitySchema.plugin(mongoosePaginate);
module.exports = mongoose.model('activitySchema', activitySchema, 'activitySchema');
// module.exports = activitySchema;
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate');
const util = require('../../Utilities/util');

var adminLogin = mongoose.Schema({
    email: {
        type: String,
        require: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        require: false,
        default: null
    },
    firstName: {
        type: String,
        trim: true,
        require: false,
        default: ""
    },
    lastName: {
        type: String,
        require: false,
        trim: true,
        default: ""
    },
    middleName: {
        type: String,
        require: false,
        trim: true,
        default: ""
    },
    age: {
        type: Number,
        default: null

    },
    phone: {
        type: Number,
        default: 0
    },
    forgotToken: {
        type: Number,
        default: 0
    },
    StudentId: {
        type: String,
        trim: true,
        require: false,
        default: ""
    },
    DOB: {
        type: Date,
        require: false,
        default: null
    },
    image: {
        type: String,
        default: ""
    },
    batchSpecialization: {
        type: String,
        trim: true,
        require: false,
        default: ""
    },
    userType: {
        type: String,
        enum: ['USER', "ADMIN", "MANAGEMENT", "STUDENT"],
        default: 'STUDENT',
        lowercase: false,
        uppercase: true
    },
    studentPoint: {
        type: Number,
        default: 500,
    },
    program: {
        type: String,
        trim: true,
        require: false,
        uppercase: true,
        default: ""
    },
    lastLogin: {
        type: Date,
        default: Date.now()
    },
    deviceToken: {
        type: String,
        default: ""
    },
    jwtToken: {
        type: String,
        default: ""
    },
    deviceType: {
        type: String,
        enum: ['IOS', 'ANDROID', 'WEB'],
        default: 'WEB'
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
adminLogin.plugin(mongoosePaginate);
adminLogin = mongoose.model('adminLogin', adminLogin, 'adminLogin');
module.exports = adminLogin;

function init() {
    adminLogin.findOne({}, (error, success) => {
        if (error) {
            console.log(error)
        } else {
            if (success == null) {
                new adminLogin({
                    firstName: "ADMIN",
                    email: "adminSPJ@yopmail.com",
                    password: util.encryptData("123456"),
                    userType: "ADMIN"
                }).save((error, success) => {
                    console.log("Successfully login ", error, success)
                })
            }
        }
    })
}
init();
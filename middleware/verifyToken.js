const jwt = require('jsonwebtoken');
const commonFunction = require('../commonFile/commonFunction')
const config = require('../config/config.dev')
const util = require('../Utilities/util')
const userModel = require('../Models/adminModels/userPanelSchema')
const auth = {
    verifyToken: (req, res, next) => {
        console.log("req.headers.token-=========>>>>", req.headers.accesstoken)
        if (!req.headers.accesstoken || req.headers.accesstoken == "" || req.headers.accesstoken == "") {
            // console.log("token not verified", req.headers.accessToken)
            res.send({ "statusCode": "401", "statusMessage": "provide access tokenw" })
            return
        }
        commonFunction.jwtDecode(req.headers.accesstoken, (err, decoded) => {
            console.log(err, decoded)
            if (err) {
                res.send({ "statusCode": "501", "statusMessage": "access token related error", "error": err })
            } else {
                userModel.findOne({ _id: decoded }).exec((err, result) => {
                    // console.log(err, result)
                    if (err || !result || result.status == "INACTIVE") {
                        res.send({ 'statusCode': util.statusCode.WENT_WRONG, 'statusMessage': util.statusMessage.DELETE_BY_ADMIN['en'] })
                    }
                    else if(result.jwtToken!=req.headers.accesstoken){
                        res.send({ 'statusCode': util.statusCode.WENT_WRONG, 'statusMessage': util.statusMessage.LOGOUT['en'] })
                    } else {
                        next()
                    }
                })
                // next();
            }
        })
    }
};



module.exports = auth;
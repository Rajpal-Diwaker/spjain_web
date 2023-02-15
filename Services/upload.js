var csv = require('fast-csv');
var mongoose = require('mongoose');
var Author = require('../Models/adminModels/authorSchema');
var loginAdmin = require('../Models/adminModels/userPanelSchema');
const async = require('async');
let util = require('../Utilities/util');
const commonFunction = require('../commonFile/commonFunction');
const multiparty = require('multiparty');
var fileUpload = require('express-fileupload');

// const app=require('express')()
// app.use(fileUpload());
exports.post = function (req, res) {

    if (!req.files)
        return res.send({ statusCode: 409,  message: 'Please Upload a file'});


    var authorFile = req.files.file;
    console.log(authorFile)
    var authors = [];

    csv
        .fromString(authorFile.data.toString(), {
            headers: true,
            ignoreEmpty: true
        })
        .on("data", function (data) {
            data['_id'] = new mongoose.Types.ObjectId();

            authors.push(data);
        })
        .on("end", function () {


            authors.forEach(ele => {
                // commonFunction.sendMailTest(ele.email,"SPJAIN login",ele.password,(err,result)=>{
                //     console.log(err,result)
                // })
                ele.program=ele.chorot;
                ele.password = util.encryptData(ele.password);
                  commonFunction.sendMailTest(ele.email,"SPJAIN login",ele.password,(err,result)=>{
                    console.log(err,result)
                })
            })
            console.log(authors)

            loginAdmin.create(authors, function (err, documents) {

                console.log(err, documents)
                if (err) {
                    res.send({ statusCode: 409, authors: authors.length, message: 'DUPLICATE STUDENT DATA', err: err.errmsg.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi) });
                }
                else {


            //      authors.forEach(ele => {
            //     commonFunction.sendMailTest(ele.email,"SPJAIN login",ele.password,(err,result)=>{
            //         console.log(err,result)
            //     })
            // })

                    res.send({ statusCode: 200, authors: authors.length, message: ' Student have been successfully uploaded.', err: err, documents: documents });
                }

            });



            // res.send(authors.length + ' authors have been successfully uploaded.');
        });
};
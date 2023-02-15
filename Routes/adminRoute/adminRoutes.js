var adminRouter = require("express").Router()
var adminHandler = require('../../Services/adminServices/adminServices')
const authHandler = require('../../middleware/verifyToken')



adminRouter.post('/login', (req, res) => {
    adminHandler.login(req.body, (data) => {
        res.send(data)
    })
})
adminRouter.post('/createSubAdmin', (req, res) => {
    adminHandler.createSubAdmin(req.body, (data) => {
        res.send(data)
    })
})
adminRouter.post('/forgotPassword', (req, res) => {
    adminHandler.forgotPassword(req.body, (data) => {
        res.send(data)
    })
})


adminRouter.post('/createActivity', (req, res) => {
    adminHandler.createActivity(req, (data) => {
        res.send(data)
    })
})

adminRouter.get('/getEventDetails', (req, res) => {
    adminHandler.getEventDetails(req.query, (data) => {
        res.send(data)
    })
})
adminRouter.get('/getUserDetails', (req, res) => {
    adminHandler.getUserDetails(req.query, (data) => {
        res.send(data)
    })
})
adminRouter.post('/getAllUser', (req, res) => {
    adminHandler.getAllUser(req.body, (data) => {
        res.send(data)
    })
})

adminRouter.get('/getAllEvent', (req, res) => {
    adminHandler.getAllEvent(req.query, (data) => {
        res.send(data)
    })
})
adminRouter.post('/changePassword', (req, res) => {
    adminHandler.changePassword(req.body, req.headers, (data) => {
        res.send(data)
    })
})

adminRouter.post('/createStudent', (req, res) => {
    adminHandler.createStudent(req.body, (data) => {
        res.send(data)
    })
})
adminRouter.post('/deleteActivity', (req, res) => {
    adminHandler.deleteActivity(req.body, (data) => {
        res.send(data)
    })
})
adminRouter.post('/editActivity', (req, res) => {
    adminHandler.editActivity(req, (data) => {
        res.send(data)
    })
})

adminRouter.post('/deleteStudent', (req, res) => {
    adminHandler.deleteStudent(req.body, (data) => {
        res.send(data)
    })
})

adminRouter.get('/calenderView', (req, res) => {
    adminHandler.calenderView(req.query, (data) => {
        res.send(data)
    })
})

adminRouter.get('/logAttendance', (req, res) => {
    adminHandler.logAttendance(req.query, (data) => {
        res.send(data)
    })
})
module.exports = adminRouter;
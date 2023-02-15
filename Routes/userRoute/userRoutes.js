var userRouter = require("express").Router()
var userHandler = require('../../Services/userServices/userServices')
const authHandler = require('../../middleware/verifyToken')


userRouter.post('/getAllEvent',authHandler.verifyToken, (req, res) => {
    userHandler.getAllEvent(req.body,req.headers, (data) => {
        res.send(data)
    })
})

userRouter.get('/getMyProfile',authHandler.verifyToken, (req, res) => {
    userHandler.getMyProfile(req.query,req.headers, (data) => {
        res.send(data)
    })
})

userRouter.get('/myPointSpent',authHandler.verifyToken, (req, res) => {
    userHandler.myPointSpent(req.query,req.headers, (data) => {
        res.send(data)
    })
})


userRouter.get('/getMyActivity',authHandler.verifyToken, (req, res) => {
    userHandler.getMyActivity(req.query,req.headers, (data) => {
        res.send(data)
    })
})
userRouter.post('/editProfile',authHandler.verifyToken, (req, res) => {
    userHandler.editProfile(req,req.headers, (data) => {
        res.send(data)
    })
})

userRouter.get('/calendarView',authHandler.verifyToken, (req, res) => {
    userHandler.calendarView(req.query,req.headers, (data) => {
        res.send(data)
    })
})
/* RIGHT NOW ITS RUNS ON IOS ONLY  */
userRouter.get('/calendarViewAndroid',authHandler.verifyToken, (req, res) => {
    userHandler.calendarViewAndroid(req.query,req.headers, (data) => {
        res.send(data)
    })
})

/* THIS IS RUNS ON ANDROID ONLY FOR NADIYA  */
userRouter.post('/newCalendar',authHandler.verifyToken, (req, res) => {
    userHandler.newCalendar(req.body,req.headers, (data) => {
        res.send(data)
    })
})
userRouter.get('/notificationList',authHandler.verifyToken, (req, res) => {
    userHandler.notificationList(req.query,req.headers, (data) => {
        res.send(data)
    })
})
//!forgotPassword
userRouter.post('/forgotPassword', (req, res) => {
    userHandler.forgotPassword(req.body, (data) => {
        res.send(data)
    })
})

userRouter.get('/getEventDetails',authHandler.verifyToken, (req, res) => {
    userHandler.getEventDetails(req.query,req.headers, (data) => {
        res.send(data)
    })
})

userRouter.post('/getEventByDate',authHandler.verifyToken, (req, res) => {
    userHandler.getEventByDate(req.body,req.headers, (data) => {
        res.send(data)
    })
})
userRouter.get('/logout',authHandler.verifyToken, (req, res) => {
    userHandler.logout(req.query,req.headers, (data) => {
        res.send(data)
    })
})
module.exports = userRouter;

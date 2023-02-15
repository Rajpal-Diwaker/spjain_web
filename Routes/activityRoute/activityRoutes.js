var activityRouter = require("express").Router();
var activityService = require('../../Services/activityServices/activityService');
const authHandler = require('../../middleware/verifyToken');



activityRouter.post('/bookedActivity', (req, res) => {
    activityService.bookedActivity(req.body,req.headers, (data) => {
        res.send(data)
    })
})
activityRouter.post('/giftActivity', (req, res) => {
    activityService.giftActivity(req.body,req.headers, (data) => {
        res.send(data)
    })
})

activityRouter.get('/getEventDetails', (req, res) => {
    activityService.getEventDetails(req.query,req.headers, (data) => {
        res.send(data)
    })
})

module.exports = activityRouter;
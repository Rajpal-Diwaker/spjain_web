let
  express = require('express'),
  app = require('express')(),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  config = require("./Utilities/config").config,
  mongoConnect = require('./Utilities/mongooseConfig'),
  path = require('path'),
  morgan = require("morgan");

var server = require('http').Server(app);
var commonFunction=require('./commonFile/commonFunction');
var fileUpload = require('express-fileupload');

app.use(morgan("dev"));
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next()
});

// app.use(fileUpload());
// commonFunction.sendSMS("123456789",+966555308714,(err,result)=>{
//   console.log(err,result)
// })
// commonFunction.sendMailTest("ashutosh.pandey@spjain.org","test","asdfasdf",(err,result)=>{
//   console.log(err,result)
// })

console.log(new Date())

let adminRoute = require('./Routes/adminRoute/adminRoutes');
let activityRoute = require('./Routes/activityRoute/activityRoutes');
let userRoute = require('./Routes/userRoute/userRoutes');

app.use('/admin', adminRoute);
app.use('/activity', activityRoute);
app.use('/user', userRoute);

app.use(fileUpload());

var template = require('./Services/template');
app.get('/template', template.get);

var upload = require('./Services/upload');
app.post('/updateFile', upload.post);


// app.get('/', function (req, res) {
//     res.sendFile(__dirname + 'dist/index.html');
//   });
app.use("/", express.static(path.join(__dirname, 'dist')));
app.get('/*', (req, res) => {
  res.sendFile(`${__dirname}/dist/index.html`);
})
server.listen(config.NODE_SERVER_PORT.port, function () {
  console.log('app listening on port:' + config.NODE_SERVER_PORT.port + (new Date));
});
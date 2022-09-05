const express = require("express");
const https = require("https");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const app = express();

mongoose.connect("mongodb://localhost:27017/cowinDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.use(express.static("public"));

app.use(bodyParser.urlencoded({
  extended: true
}));

var nodemailer = require('nodemailer');


const cowinSchema = new mongoose.Schema({
  pemail: String,
  pAge: Number,
  dCode: String
});

const Item = mongoose.model("Item", cowinSchema);

app.get("/", function(req, res) {
  res.sendFile(__dirname + "/main.html");
});

app.post("/", function(req, res) {
  const item = new Item({
    pemail: req.body.email,
    pAge: req.body.age,
    dCode: req.body.code
  });
   item.save();
   res.send("Successfully entered the details");
});

var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1
var yyyy = today.getFullYear();
if (mm < 10) {
  mm = '0' + mm;
}
today = dd + '-' + mm + '-' + yyyy;

function mail(to = mailto) {
  var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      // user: sender's email,
      // pass: password
    }
  });

  var mailOptions = {
    // from: sender's email,
    // to,
    subject: 'Slots are available',
    text: 'Hurry!!!!!!'
  };

  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });

}

setInterval(intervalFunc, 10000);

function intervalFunc() {
  Item.find(function(err, content) {
    if (err) {
      console.log("erorrrrrrr")
    } else {
      if (content.length === 0) {
        console.log("no entry");
      } else {
        for (var i = 0; i < content.length; i++) {
          const personEmail = content[i].pemail;
          const personAge = content[i].pAge;
          const personId = content[i]._id;
          const districtId = content[i].dCode;

          const url = "https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByDistrict?district_id=" + districtId + "&date=" + today;
          https.get(url, function(response) {
            var str = '';
            response.on("data", function(chunk) {
              str += chunk;
            });
            response.on('end', function() {
              const covidData = JSON.parse(str);
              // console.log(covidData);
              console.log("1");
              for (var j = 0; j < covidData.sessions.length; j++) {
                if (personAge >= covidData.sessions[j].min_age_limit) {
                  console.log("2");
                  if (covidData.sessions[j].available_capacity_dose1 > 0) {
                    //          mail
                    console.log("3");
                    var mailto = personEmail;
                    mail(mailto);
                    //          delete from list
                    console.log("4");
                    Item.deleteOne({
                      _id: personId
                    }, function(err) {
                      if (!err) console.log("deleted");

                    });
                    break;
                  }
                }
              }
            });
          })
        };
      }
    }
  });
}

app.listen(3000, function() {
  console.log("server started on port 3000");
});

const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const router = express.Router()
const urlencodedParser = bodyParser.urlencoded({extended:true})
const Run = require('../models/Run')
const helpers = require('../utils/inputHelpers');
const slash = require('../utils/slashCommandHelpers')
const response = require('../utils/responseHelpers')
require('dotenv').config()
// let mainObj = {}

router.get('/', (req, res, next) => {
	res.status(200).sendFile('/public/index.html')
})

//slack button route
router.get('/auth', (req, res)=>{
	res.sendFile(__dirname + '/public/index.html')
})

//slack button authorization
router.get('/auth/redirect', (req, res)=>{
	var options = {
        uri: 'https://slack.com/api/oauth.access?code='
            +req.query.code+
            '&client_id='+process.env.CLIENT_ID+
            '&client_secret='+process.env.CLIENT_SECRET+
            '&redirect_uri='+process.env.REDIRECT_URI,
        method: 'GET'
    }

  request(options, (error, response, body) => {
      var JSONresponse = JSON.parse(body)
      if (!JSONresponse.ok){
          res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end()
      }else{
          res.send("/")
      }
  })
})

//formats and posts all of the inputs for trackbot
router.post('/trackbot', function(req, res, next){
	console.log('reqbody: '+ JSON.stringify(req.body))
	let reqBody = req.body
	let responseURL = reqBody.response_url
	var userName = req.body.user_name
	let editedUserName = userName.charAt(0).toUpperCase()+userName.substr(1)
	console.log("TRACKBOT RESPONSEURL: " + JSON.stringify(responseURL))
	slash.command(reqBody, editedUserName, responseURL)
})

//posts each action and will send to req.body info to sendMessageToSlackResponseURL function
router.post('/log/actions', urlencodedParser, (req, res) =>{
	res.status(200).end() // best practice to respond with 200 status
	let payload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
	let token = payload.token,
	selectedValue=null,
	actions,
	userID,
	teamID,
	channelID,
	clicked,
	exerciseType,
	mainObj,
	userObj,
	editedUserName


	if(token == process.env.VERIFICATION_TOKEN){
		teamID=payload.team.id
		userID=payload.user.id
		channelID=payload.channel.id
		actions = payload.actions[0]
		clicked = actions.name
		userObj = helpers.mainObj[(teamID+userID)]
		userKey = teamID + userID
		userName = payload.user.name
		editedUserName = userName.charAt(0).toUpperCase()+userName.substr(1)

		//only fires for select_option inputs
		if(actions.selected_options!=undefined){
			selectedValue = actions.selected_options[0].value
		}

		if(payload.callback_id == 'exerciseType'){
			userObj.exerciseType = clicked
			return
		}

		switch(clicked){
			case 'submit':
				let message={}
				//SUBMITRUN FUNCTION IS LOCATED IN UTILS/RESPONSEHELPERS.JS LINE 21
				//UNCOMMENT LINE 156 IN UTILS/RESPONSEHELPERS TO SEND RUN TO DATABASE
				response.submitRun(payload)
				break;
			case 'distanceNumber':
				userObj.exerciseDistance = selectedValue
				break;
			case 'distanceType':
				userObj.distanceType = selectedValue
				break;
			case 'exerciseHours':
				userObj.exerciseHours = selectedValue
				break;
			case 'exerciseMinutes':
				userObj.exerciseMinutes = selectedValue
				break;
			case 'cancel':
				console.log('USEROBJECT: ' + JSON.stringify(helpers.mainObj))
				if(helpers.mainObj[userKey]){
					helpers.mainObj[userKey]={}
				}
				console.log('USEROBJECT IS DELETED FROM MAINOBJ: ' + JSON.stringify(helpers.mainObj))
				break;
			default:
				break;
		}
		//STATIC OBJECT FOR ENTERING STATIC DB RECORDS
		// let runObj = {
		// 	userID:'K123sk4',
		// 	teamID:'NKeko3333',
		// 	exersiseDate: Date.now(),
		// 	exerciseMinutes: 680,
		// 	channelID: 'KDK39d9',
		// 	userName: 'genestd',
		// 	distanceType: 'miles',
		// 	exerciseDistance: 12.5,
		// 	exerciseType: 'run',
		// 	exerciseHours: 1,
		// 	timestamp: Date.now()
		// }

	} else {
		console.log("VERIFICATION_TOKEN ERROR")
		return
	}
})

module.exports = router

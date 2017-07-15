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
	userObj


	if(token == process.env.VERIFICATION_TOKEN){
		teamID=payload.team.id
		userID=payload.user.id
		channelID=payload.channel.id
		actions = payload.actions[0]
		clicked = actions.name
		userObj = helpers.mainObj[(teamID+userID)]
		userKey = teamID + userID
		userName = payload.user.name

		//only fires for select_option inputs
		if(actions.selected_options!=undefined){
			selectedValue = actions.selected_options[0].value
		}

		if(payload.callback_id == 'exerciseType'){
			userObj.exerciseType = clicked
			return
		}

		switch(clicked){
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


		// CHECK FOR IDS
		// console.log("payload------TEAM ID:" + teamID + " CHANNEL ID: " + channelID + "----UNIQUEID: " + teamID + userID )

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

			if(clicked == 'submit'){

				let keys = {
					userID,
					teamID,
					channelID,
					userKey,
					userName
				}

				//ADD THE REST OF THE ID'S TO THE MAIN OBJECT
				for(let k in keys) userObj[k] = keys[k]
				console.log("SUBMITTED USEROBJECT: " + JSON.stringify(userObj))
				//ADD EXERCISE OBJECT TO DATABASE
				// createRun(userObj)
				// //DELETE CURRENT USER OBJECT IN MAIN OBJECT
				// if(helpers.mainObj[userKey]){
				// 	delete helpers.mainObj[userKey]
				// }
				console.log('USEROBJECT IS DELETED FROM MAINOBJ: ' + JSON.stringify(helpers.mainObj))
				return
			}
		} else {
			console.log("VERIFICATION_TOKEN ERROR")
			return
		}

		//MESSAGE TO SEND BACK TO SLACK INTERFACE
			// let message = {
			// 	"text": "{" + userID + "}" + payload.user.name + "--- CALLBACK_ID: " + payload.callback_id + "--- TYPE: "+actions.type + "--- CLICKED(aka name): " + clicked + " ---VALUE: "+selectedValue,
			// 	"replace_original": false
			// }
			// console.log('SENDMESSAGE OBJECT: ' + JSON.stringify(message))
		//FUNCTION SENDS MESSAGE REMBEMBER IMPORT TAG
		// sendMessageToSlackResponseURL(payload.response_url, message)
})

//CREATE NEW RUN INSTANCE AND SEND TO DATABASE----MOVE TO HELPER FILE
function createRun(obj){
	const newRun = new Run(obj)
	newRun.save()
	console.log('Added a new exercise record into collection');
 	return newRun;
}

module.exports = router

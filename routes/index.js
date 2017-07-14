const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const router = express.Router()
const urlencodedParser = bodyParser.urlencoded({extended:true})
const Run = require('../models/Run')
const helpers = require('../utils/inputHelpers');
require('dotenv').config()

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
	var reqBody = req.body
	var responseURL = reqBody.response_url
	var userName = req.body.user_name
	let editedUserName = userName.charAt(0).toUpperCase()+userName.substr(1)

	switch(req.body.text){
		case 'view':
			var botPayload = {
				"response_type": 'ephemeral',
				"text": "*"+editedUserName +"\'s Log*\n\n*Date*\t*ExerciseType*\t*Distance*\t*Time*"
			}
			sendMessageToSlackResponseURL(responseURL, botPayload)
			break;
		case 'help':
			var botPayload = {
			"response_type": 'ephemeral',
			"text": "Hi *" + editedUserName + "*! What would you like to do? \n\nType:\n `/trackbot add` to add a new exercise or \n`/trackbot view` to view your exercises or \n`/trackbot leaderboard` to view who is in the lead this week."
			}
			sendMessageToSlackResponseURL(responseURL, botPayload)
			break;
		case 'add':
			var botPayload = {
				"response_type": 'ephemeral',
				"text": "Hi *" + editedUserName + "*!",
				"attachments": [
					 {
						 "text":"Choose your Exercise Type:",
						 "mrkdwn": true,
						 "fallback": "You are unable to choose an exercise",
						 "callback_id": "exerciseType",
						 "color": "#3AA3E3",
						 "attachment_type": "default",
						 "actions": [
							 {
								 "name": "run",
								 "text": "Run",
								 "type": "button",
								 "value": "run"
							 },
							 {
								 "name": "walk",
								 "text": "Walk",
								 "type": "button",
								 "value": "walk"
							 },
							 {
								 "name": "bike",
								 "text": "Bike",
								 "type": "button",
								 "value": "bike"
							 }
						 ]
					 },
					 {
						 "text":"What was your distance?:",
						 "mrkdwn": true,
						 "fallback": "You are unable to choose an distance",
						 "callback_id": "exerciseDistance",
						 "color": "#ff3333",
						 "attachment_type": "default",
						 "actions":[
							 {
								"name": 'distanceNumber',
								"text": 'Distance',
								"type": 'select',
								"value": 'distanceNumber',
								"style": 'primary',
								"options": helpers.loopDistanceInputNumbers(45)
							 },
							 {
								"name": 'distanceFormat',
								"text": 'Miles or Kilometers',
								"type": 'select',
								"value": 'distanceFormat',
								"style": 'primary',
								"options": [
									{
										"text": "mile(s)",
										"value": "miles"
									},
									{
										"text": "kilometer(s)",
										"value": "kilometers"
									}
								]
							 }
						 ]
					 },
					 {
						 "text":"How long was your exercise?",
						 "mrkdwn": true,
						 "fallback": "You are unable to choose an time",
						 "callback_id": "exerciseTime",
						 "color": "#00cc44",
						 "attachment_type": "default",
						 "actions":[
							 {
								"name": 'hour',
								"text": 'Hours',
								"type": 'select',
								"value": 'hour',
								"style": 'primary',
								"options": helpers.loopInputNumbers(20)
								},
								{
									"name": 'minutes',
									"text": 'Minutes',
									"type": 'select',
									"value": 'minutes',
									"style": 'primary',
									"options": helpers.loopMinutes(59)
								}
							]
						},
						{
						 "text":"Submit exercise to your log?",
						 "mrkdwn": true,
						 "fallback": "Not done",
						 "callback_id": "completeExercise",
						 "color": "#fff",
						 "attachment_type": "default",
						 "actions": [
							 {
								 "name": "submit",
								 "text": "Submit",
								 "type": "button",
								 "value": "submit",
								 "confirm": {
									 "title": "Are you sure?",
									 "text": "Think about it.",
									 "ok_text": "Yes",
									 "dismiss_text": "No"
									}
							 },
							 {
								 "name": "cancel",
								 "text": "Cancel",
								 "type": "button",
								 "value": "cancel"
							 }
							]
						}
					]
				}
				sendMessageToSlackResponseURL(responseURL, botPayload)
				break;
			case 'leaderboard':
				var botPayload = {
				"response_type": 'ephemeral',
				"text": "Hi *" + editedUserName + "*! Here is the leaderboard"
				}
				sendMessageToSlackResponseURL(responseURL, botPayload)
				break;
			default:
				var botPayload = {
				"response_type": 'ephemeral',
				"text": "Hi *" + editedUserName + "*! What would you like to do? \n\nType:\n `/trackbot add` to add a new exercise or \n`/trackbot view` to view your exercises or \n`/trackbot leaderboard` to view who is in the lead this week."
				}
				sendMessageToSlackResponseURL(responseURL, botPayload)
				break;
				}
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
	clicked

	if(token == process.env.VERIFICATION_TOKEN){
		teamID=payload.team.id
		userID=payload.user.id
		channelID=payload.channel.id
		actions = payload.actions[0]
		clicked = actions.name

		console.log("payload------TEAM ID:" + teamID + " CHANNEL ID: " + channelID + "----UNIQUEID: " + teamID + userID + "---USERID: " + userID  )
		//only fires for select_option inputs
		if(actions.selected_options!=undefined){
			selectedValue = actions.selected_options[0].value
		}
		let runObj ={
			userKey:'T645HNGB1U684LB6Q1',
			userID:'U684LB6Q1',
			teamID:'T645HNGB1',
			channelID:'C62L8JPEU',
			userName:'design',
			exerciseDate: Date.now(),
			exerciseType: 'bike',
			exerciseDistance:30,
			distanceType:'miles',
			exerciseHours:2,
			exerciseMinutes:35
		}
			//cretes a new run record in the database
			if(clicked == 'submit'){
				console.log('SUMBITTED: ' + JSON.stringify(runObj))
				createRun(runObj)
			}
		} else{
			console.log("VERIFICATION_TOKEN ERROR")
		}

	// test message to send to sendMessageToSlackResponseURL function to show when a button or input is clicked
		let message = {
			"text": "{" + userID + "}" + payload.user.name + "--- CALLBACK_ID: " + payload.callback_id + "--- TYPE: "+actions.type + "--- CLICKED(aka name): " + clicked + " ---VALUE: "+selectedValue,
			"replace_original": false
		}
		console.log(message)
	//thfunction below can be used for validation of inputs
	// sendMessageToSlackResponseURL(payload.response_url, message)
})

//function that creates a new run object and saves it to mongo database
function createRun(obj){
	const newRun = new Run(obj)
	newRun.save()
	console.log('Added a new slack user todo list document into collection');
 	return newRun;
}

//posts messages back to slack.
function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  var postOptions = {
      uri: responseURL,
      method: 'POST',
      headers: {
          'Content-type': 'application/json'
      },
      json: JSONmessage
  }
  request(postOptions, (error, response, body) => {
      if (error){
          console.log("ERROR: sendMessageToSlackResponseURL error" + error)
      }else{
				// console.log("RESPONSE: " + JSON.stringify(response))
			}
  })
}

module.exports = router

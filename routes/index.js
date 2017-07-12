const express = require('express')
const request = require('request')
const bodyParser = require('body-parser')
const router = express.Router()
const urlencodedParser = bodyParser.urlencoded({extended:true})
const User = require('../models/Run')
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
          console.log("AUTH/REDIRECT ERROR" +JSON.stringify(JSONresponse))
          res.send("Error encountered: \n"+JSON.stringify(JSONresponse)).status(200).end()
      }else{
          console.log("REQUEST RESPONSE" +JSON.stringify(JSONresponse))
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
			break;
		case 'help':
			var botPayload = {
			"response_type": 'ephemeral',
			"text": "Hi *" + editedUserName + "*! What would you like to do? \n\nType:\n `/trackbot add` to add a new exercise or \n`/trackbot view` to view your exercises or \n`/trackbot leaderboard` to view who is in the lead this week."
			}
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
								"options": helpers.loopDistanceInputNumbers(50)
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
				break;
			case 'leaderboard':
				var botPayload = {
				"response_type": 'ephemeral',
				"text": "Hi *" + editedUserName + "*! Here is the leaderboard"
				}
				break;
			default:
				var botPayload = {
				"response_type": 'ephemeral',
				"text": "Hi *" + editedUserName + "*! What would you like to do? \n\nType:\n `/trackbot add` to add a new exercise or \n`/trackbot view` to view your exercises or \n`/trackbot leaderboard` to view who is in the lead this week."
				}
				break;
				}
	sendMessageToSlackResponseURL(responseURL, botPayload)
})

//posts each action and will send to req.body info to sendMessageToSlackResponseURL function
router.post('/log/actions', urlencodedParser, (req, res) =>{
	res.status(200).end() // best practice to respond with 200 status
	let actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
	let token = actionJSONPayload.token
	let selectedValue = null
	let actions = null
	if(token == process.env.VERIFICATION_TOKEN){
		let ID=actionJSONPayload.user.id
		actions = actionJSONPayload.actions[0]


		//only fires for select_option inputs
		if(actions.selected_options!=undefined){
			selectedValue = actions.selected_options[0].value
		}
			console.log(`ID: ${ID}\ACTION: ${actions} INDEX: ${selectedValue}`)

			//cretes a user in the database
			if(actions == 'submit'){
				createUser(ID, null)
			}
		} else{
			console.log("VERIFICATION_TOKEN ERROR")
		}

	//holder to show when a button or input is clicked
	let message = {
			"text": actionJSONPayload.user.name + " clicked: "+actions.type + " for " + actions.name+ " value: "+selectedValue,
			"replace_original": false
	}
	sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})

//will become a helper function to create the user
function createUser(user_id, result) {
  // If user not found, create new user
  if (result === null) {
    const newUser = new User({
      id: user_id
    });
    newUser.save();
    console.log('Added a new slack user todo list document into collection');
    return newUser;
  }
  else {
    return result;
  }
}

//sends Post request to the responseURL and console logs each button pushed
function sendMessageToSlackResponseURL(responseURL, JSONmessage){
	console.log("Clicked Message: " + JSON.stringify(JSONmessage))
  let postOptions = {
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

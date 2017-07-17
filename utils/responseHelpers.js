const request = require('request')
const Run = require('../models/Run')
const helpers = require('./inputHelpers')

let sendMessageToSlackResponseURL = (responseURL, JSONmessage)=>{
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
					console.log(error)
			}
	})
}

let createRun = (obj) => {
	const newRun = new Run(obj)
	newRun.save()
	console.log('Added a new exercise record into collection');
 	return newRun;
}

let submitRun = (payload) => {
	console.log("PAYLOAD: " + JSON.stringify(payload))
	let teamID=payload.team.id,
	userID=payload.user.id,
	channelID=payload.channel.id,
	actions = payload.actions[0],
	clicked = actions.name,
	userObj = helpers.mainObj[(teamID+userID)],
	userKey = teamID + userID,
	userName = payload.user.name,
	editedUserName = userName.charAt(0).toUpperCase()+userName.substr(1)

	switch(true){
		case userObj.exerciseType==undefined:
			message = {

			"response_type": "ephemeral",
			"replace_original": false,
			"attachments": [
					{
							"fallback": "Error",
							 "title": ":pencil: Please click \'Run\', \'Walk\' or \'Bike\' as your EXERCISE TYPE :arrow_up:",
							 "color":"#ff9900",
							"callback_id": "submit_error",
							"attachment_type": "default"
					}
				]
			}
			sendMessageToSlackResponseURL(payload.response_url, message)
			break;
		case userObj.exerciseDistance == undefined && userObj.exerciseHours == undefined && userObj.exerciseMinutes == undefined:
			message = {
			"response_type": "ephemeral",
			"replace_original": false,
			"attachments": [
					{
							"fallback": "Error",
							 "title": ":pencil: You MUST enter DISTANCE and/or TIME :arrow_up:",
							 "color":"#ff9900",
							"callback_id": "submit_error",
							"attachment_type": "default"
					}
				]
			}
			sendMessageToSlackResponseURL(payload.response_url, message)
			break;

		case userObj.exerciseDistance && userObj.distanceType==undefined:
			message = {
			"response_type": "ephemeral",
			"replace_original": false,
			"attachments": [
					{
							"fallback": "Error",
							 "title": ":pencil: Please choose \'MILES\' or \'KILOMETERS\' in the DISTANCE section :arrow_up:",
							 "color":"#ff9900",
							"callback_id": "submit_error",
							"attachment_type": "default"
					}
				]
			}
			sendMessageToSlackResponseURL(payload.response_url, message)
			break;

		case userObj.exerciseDistance==undefined && userObj.distanceType:
			message = {
			"response_type": "ephemeral",
			"replace_original": false,
			"attachments": [
					{
							"fallback": "Error",
							 "title": ":pencil: Please choose a value for the DISTANCE :arrow_up:",
							 "color":"#ff9900",
							"callback_id": "submit_error",
							"attachment_type": "default"
					}
				]
			}
			sendMessageToSlackResponseURL(payload.response_url, message)
			break;

		default:
			let distance = " Distance: No distance entered",
			time= "Time: No time entered",
			hours=0,
			minutes=0

			if(userObj.exerciseDistance && userObj.distanceType){
				distance = "Distance: " + userObj.exerciseDistance + " " + userObj.distanceType
			}
			if(userObj.exerciseHours){
				hours = userObj.exerciseHours
			}
			if(userObj.exerciseMinutes){
				minutes = userObj.exerciseMinutes
			}

			time= "Time: " + hours + " hour(s) and " + minutes + " minutes."

			message = {
				"text":":clap: *CONGRATULATIONS " + editedUserName + "!*",
				"response_type": "ephemeral",
				"replace_original": false,
				"attachments": [
						{
							"fallback": "Success",
							 "title": "Exercise Type: " + userObj.exerciseType+ "\n" + time + "\n" + distance,
							 "color":"#00cc44",
							"callback_id": "submit_success",
							"attachment_type": "default"
						}
					]
				}
			sendMessageToSlackResponseURL(payload.response_url, message)

			let keys = {
				userID,
				teamID,
				channelID,
				userKey,
				userName
			}

			// //ADD THE REST OF THE ID'S TO THE MAIN OBJECT
			for(let k in keys) userObj[k] = keys[k]
			console.log("SUBMITTED USEROBJ: " + JSON.stringify(userObj))

			// //ADD EXERCISE OBJECT TO DATABASE
			createRun(userObj)
			//
			// // //DELETE CURRENT USER OBJECT IN MAIN OBJECT
			if(helpers.mainObj[userKey]){
				delete helpers.mainObj[userKey]
			}
			console.log('USEROBJ IS DELETED FROM MAINOBJ: ' + JSON.stringify(helpers.mainObj))
			message = {}
			break;
	}
}


module.exports = {
	sendMessageToSlackResponseURL,
	submitRun,
	createRun
}

const response = require('./responseHelpers')
const helpers = require('./inputHelpers')
const Run = require('../models/Run')
module.exports = {
	command: (reqBody, editedUserName, responseURL) => {
		let botPayload;

		switch(reqBody.text){
			case 'view':
			  console.log(reqBody)
				var key = reqBody.team_id + reqBody.user_id
				var query = [
					// filter the results by our userId
					{ $match: { userKey: key } }
				]
				query.push(
					{ $sort: {exerciseDate: -1} }
				)
				query.push(
					{ $project: {exerciseDate: 1, exerciseType: 1, exerciseDistance: 1, exerciseHours: 1, exerciseMinutes: 1}}
				)
				return Run
					.aggregate(query)
					.then( result=>{
						console.log('result: ', result)
						botPayload = {
							"response_type": 'ephemeral',
							"text": "*Check heroku log for result*"
						}
						response.sendMessageToSlackResponseURL(responseURL, botPayload)
					})
				break;
			case 'help':
				botPayload = {
				"response_type": 'ephemeral',
				"text": "Hi *" + editedUserName + "*! What would you like to do? \n\nType:\n `/trackbot add` to add a new exercise or \n`/trackbot view` to view your exercises or \n`/trackbot leaderboard` to view who is in the lead this week."
				}
				response.sendMessageToSlackResponseURL(responseURL, botPayload)
				break;
			case 'add':
				helpers.mainObj[reqBody.team_id+reqBody.user_id]={}
				console.log("MAIN OBJECT: " + JSON.stringify(helpers.mainObj))

				botPayload = {
					"response_type": 'ephemeral',
					"text": "Welcome to TRACKBOT *" + editedUserName + "*!\n\nEnter your EXERCISE TYPE and either the DISTANCE of your exercise OR the TIME LENGTH of your exercise OR Both DISTANCE and TIME LENGTH(recommended)\n",
					"attachments": [
						 {
							 "text":"Choose your EXERCISE TYPE:",
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
							 "text":"What was your DISTANCE?:",
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
									"name": 'distanceType',
									"text": 'Miles or Kilometers',
									"type": 'select',
									"value": 'distanceType',
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
							 "text":"How much TIME did your exercise take?",
							 "mrkdwn": true,
							 "fallback": "You are unable to choose an time",
							 "callback_id": "exerciseTime",
							 "color": "#ffff00",
							 "attachment_type": "default",
							 "actions":[
								 {
									"name": 'exerciseHours',
									"text": 'Hours',
									"type": 'select',
									"value": 'hour',
									"style": 'primary',
									"options": helpers.loopInputNumbers(20)
									},
									{
										"name": 'exerciseMinutes',
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
									 "value": "submit"
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
					response.sendMessageToSlackResponseURL(responseURL, botPayload)
					break;
				case 'leaderboard':
					console.log(reqBody)
					var key = reqBody.team_id + reqBody.user_id
					var query = [
						// filter the results by our userId
						{ $match: { userKey: key } }
					]
					query.push(
						//group by exercise type
						{ $group: {
							_id: '$exerciseType',
							count: { $sum: 1 }
							}
						}
					)
					return Run
						.aggregate(query)
						.then( result=>{
							console.log('result: ', result)
							botPayload = {
								"response_type": 'ephemeral',
								"text": "*Check heroku log for result*"
							}
							response.sendMessageToSlackResponseURL(responseURL, botPayload)
						})

					break;
				default:
					botPayload = {
					"response_type": 'ephemeral',
					"text": "Hi *" + editedUserName + "*! What would you like to do? \n\nType:\n `/trackbot add` to add a new exercise or \n`/trackbot view` to view your exercises or \n`/trackbot leaderboard` to view who is in the lead this week."
					}
					response.sendMessageToSlackResponseURL(responseURL, botPayload)
					break;
					}
					return
	}
}

const request = require('request')

module.exports = {
	//posts messages back to slack.
	sendMessageToSlackResponseURL: (responseURL, JSONmessage)=>{
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
}

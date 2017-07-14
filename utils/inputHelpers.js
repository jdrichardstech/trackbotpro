
module.exports = {
	//creates array of objects for inputs in attachments
	loopInputNumbers: (num) => {
	  let inputObjectsArray = []
	  for(let i=1;i<num+1;i++){
			let optionsObject = {"text" : JSON.stringify(i), "value": i}
	 		inputObjectsArray.push(optionsObject)
	  }
	  return inputObjectsArray
	},

	//creates array of formatted minutes
	 loopMinutes: (num) => {
	  let inputObjectsArray = []

	  for(let i=0;i<num+1;i++){
	    let optionsObject={}
	    if(i<10){
	      optionsObject = {"text" : ":0"+ i.toString(), "value": i}
	      inputObjectsArray.push(optionsObject)
	    } else {
	      	optionsObject = {"text" : ":"+i.toString(), "value": i}
					inputObjectsArray.push(optionsObject)
	    }
	  }
	  return inputObjectsArray
	},

	//creates array of objects for distance input in attachments
	loopDistanceInputNumbers: (num) => {
		let inputObjectsArray = []
		for(let i=.5;i<num+.5;i+=.5){
			let optionsObject = {"text" : JSON.stringify(i), "value": i}
			inputObjectsArray.push(optionsObject)
		}
		return inputObjectsArray
	}
}

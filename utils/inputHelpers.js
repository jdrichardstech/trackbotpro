
//creates array of objects for inputs in attachments
function loopInputNumbers(num){
  let inputObjectsArray = []
  for(let i=1;i<num+1;i++){
		let optionsObject = {"text" : JSON.stringify(i), "value": i}
 		inputObjectsArray.push(optionsObject)
  }
  return inputObjectsArray
}

//creates array of objects for distance input in attachments
function loopDistanceInputNumbers(num){
	let inputObjectsArray = []
	for(let i=5;i<num+1;i+=5){
		let optionsObject = {"text" : JSON.stringify(i), "value": i}
		inputObjectsArray.push(optionsObject)
	}
	return inputObjectsArray
}

module.exports = {
	loopInputNumbers: loopInputNumbers,
	loopDistanceInputNumbers: loopDistanceInputNumbers
}

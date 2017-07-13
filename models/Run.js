const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RunSchema = new Schema({
	userID: {type: String, default:''},
	teamID: {type: String, default:''},
	channelID: {type: String, default:''},
	userName:{type:String, default:''},
	exerciseDate: { type: Date, default: Date.now},
	exerciseType: {type: String, default:''},
	exerciseDistance:{type:Number, default:0},
	distanceType:{type:String, default:'miles'},
	exerciseHours:{type:Number, default: 0},
	exerciseMinutes:{type:Number, default: 0},
	timeStamp:{type:Date, default:Date.now}
})

const Run = mongoose.model('Run', RunSchema)

module.exports = Run

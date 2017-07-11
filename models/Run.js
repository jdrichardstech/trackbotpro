const mongoose = require('mongoose')
const Schema = mongoose.Schema


const RunSchema = new Schema({
	exerciseDate: { type: Date, default: Date.now},
	exerciseType: {type: String, default:''},
	exerciseDistance:{type:Number, default:0},
	distanceType:{type:String, default:'miles'},
	exerciseTime:{type:Number},
	timeStamp:{type:Date, default:Date.now}
})


const UserSchema = new Schema({
	id:String,
	list: [RunSchema]
})


const User = mongoose.model('user', UserSchema)

module.exports = User

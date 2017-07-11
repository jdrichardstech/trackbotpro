const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 3000
const mongoose = require('mongoose')
mongoose.Promise = global.Promise
const routes = require('./routes/index')
require('dotenv').config()

const databaseUri= process.env.MONGODB_URI
mongoose.connect(databaseUri, { useMongoClient: true })

app.use(express.static('public'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use('/', routes)

app.listen(port, ()=>{
	console.log('Listening on port' + port)
} )
module.exports = app;

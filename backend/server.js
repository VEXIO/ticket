let express = require('express')
let bodyParser = require('body-parser')
let app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', function (req, res) {
    res.send('Hello.')
})

app.post('/ticket/:ticketId', require('./dist/ticket.js'))

app.listen(3000, function () {
    console.log('Server started at port 3000.')
})
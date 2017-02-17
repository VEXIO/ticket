let ticket = {
    set: 'ticketSet',
    list: 'ticketList'
}

let _ticket = function (req, res) {
    let redis = require('redis').createClient()
    let params = req.params
    let reqBody = req.body
    let ticketId = params.ticketId
    let ticketSet = ticket.set + ticketId
    let ticketList = ticket.list + ticketId
    let requestSent = false

    redis.on("error", function (err) {
        redis.quit()
        if (requestSent == false){
            res.json({
                err: 1,
                msg: 'An error occured, please try again.'
            })
            requestSent = true
        }
    })

    redis.on("reconnecting", () => {
        console.log("reconnecting...")
    })

    redis.on("connect", () => {
        console.log("connect")
        if (requestSent == false)
            validateForm()
    })

    let validateForm = () => {
        let validation = true
        {['name', 'phone'].some(function (each) {
            if (!reqBody.hasOwnProperty(each)) {
                validation = false
                callback(true, {
                    err: 1,
                    code: 5,
                    msg: each
                })
                return true
            }
        })}
        if (validation)
            checkPhoneNumber()
    }

    let checkPhoneNumber = () => {
        let res = redis.sismember(ticketSet, reqBody.phone, function (err, reply) {
            if (err !== null) {
                callback(true, {
                    err: 1,
                    code: 100,
                    msg: err
                })
            } else if (Boolean(reply)) {
                callback(true, {
                    err: 1,
                    code: 101
                })
            } else {
                insertRecord()
            }
        })
    }

    let insertRecord = () => {
        let insertSuccess = () => {
            insertSuccess.cnt--
            if (0 == insertSuccess.cnt) {
                callback(null)
            }
        }
        let datetime = new Date()
        insertSuccess.cnt = 2
        redis.lpush(ticketList, JSON.stringify({
            name: reqBody.name,
            phone: reqBody.phone,
            timestamp: datetime
        }), (err, reply) => {
            if (err) {
                callback(true, {
                    err: 1,
                    code: 100,
                    msg: err
                })
            } else {
                insertSuccess()
            }
        })
        redis.sadd(ticketSet, reqBody.phone, function (err, reply) {
            if (err) {
                callback(true, {
                    err: 1,
                    code: 100,
                    msg: err
                })
            } else {
                insertSuccess()
            }
        })
    }

    let callback = (err, reply) => {
        requestSent = true
        if (err) {
            let msg
            if (typeof(reply) === 'object' && reply.hasOwnProperty('code')) {
                switch (reply.code) {
                    case 1:
                    case 100:
                    default:
                        msg = 'An error occured, please try again.'
                        break
                    case 5:
                        msg = 'Please fill in the ' + reply.msg + ' field.'
                        break
                    case 101:
                        msg = 'Phone number already exists.'
                        break
                }
            } else {
                msg = 'An error occured, please try again.'
            }
            console.error(reply)
            res.json({
                err: 1,
                msg: msg
            })
        } else {
            console.log(reply)
            res.json({
                err: 0,
                msg: 'Success!'
            })
        }
    }

}

module.exports = _ticket
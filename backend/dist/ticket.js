let ticket = {
    id: 0,
    keyBase: 'ticket',
    setBase: 'ticketSet',
    listBase: 'ticketList',
    get key() {
        return this.keyBase + this.id
    },
    get set() {
        return this.setBase + this.id
    },
    get list() {
        return this.listBase + this.id
    }
}

let _ticket = function (req, res) {
    let redis = require('redis').createClient()
    let params = req.params
    let reqBody = req.body
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
        if (validation) {
            checkStatus()
        }
    }

    let checkStatus = () => {
        let verifyStatus = () => {
            verifyStatus.cnt--
            if (verifyStatus.cnt == 0) {
                insertRecord()
            }
        }

        verifyStatus.cnt = 2

        // Check whether ticket queue has been closed.
        redis.get(ticket.key, (err, reply) => {
            if (err !== null) {
                callback(true, {
                    err: 1,
                    code: 100,
                    msg: err
                })
            } else if (Boolean(reply)) {
                callback(true, {
                    err: 1,
                    code: 102
                })
            } else {
                verifyStatus()
            }
        })

        // Check whether user has requested with same phone number.
        redis.sismember(ticket.set, reqBody.phone, function (err, reply) {
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
                verifyStatus()
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

        redis.lpush(ticket.list, JSON.stringify({
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

        redis.sadd(ticket.set, reqBody.phone, function (err, reply) {
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
        if (requestSent === true) {
            return
        } else {
            requestSent = true
        }
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
                    case 102:
                        msg = 'Tickets are exhausted.'
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
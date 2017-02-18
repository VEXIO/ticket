let ticket = require('./ticket.config.js')

let _check = (req, res) => {
    let redis = require('redis').createClient()
    let reqBody = req.body
    let requestSent = false

    ticket.id = req.params.ticketId

    redis.on("error", (err) => {
        redis.quit()
        if (requestSent == false){
            retError(res)
            requestSent = true
        }
    })

    redis.on("connect", () => {
        console.log("connect")
        if (requestSent == false)
            checkTicketStatus()
    })

    let tryRes = () => {
        tryRes.cnt--
        redis.sismember(ticket.res, reqBody.phone, (err, reply) => {
            if (err != null) {
                retError(res)
            } else if (Boolean(reply) == true){
                res.json({
                    err: 0,
                    code: 200
                })
                console.log(reply)
            } else {
                if (tryRes.cnt != 0) {
                    setTimeout(tryRes, 1000)
                } else {
                    res.json({
                        err: 0,
                        code: 201
                    })
                }
            }
        })
    }

    tryRes.cnt = 3

    let checkTicketStatus = () => {
        if (!reqBody.hasOwnProperty('phone')) {
            res.json({
                err: 1,
                msg: 'Field not full.'
            })
        } else {
            tryRes()
        }
    }

    let retError = (res) => {
        res.json({
            err: 1,
            msg: 'An error occured, please try again.'
        })
    }

}

module.exports = _check
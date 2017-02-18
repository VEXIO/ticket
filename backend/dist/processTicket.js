let ticket = require('./ticket.config.js')

let _process = () => {
    let redis = require('redis').createClient()
    let interval = null
    let reslen = null

    redis.on("error", (err) => {
        if (interval != null)
            clearInterval(interval)
    })

    redis.on("reconnecting", () => {
        console.log("Reconnecting redis...")
    })

    redis.on("connect", () => {
        console.log("Connected.")
        if (interval == null)
            setInterval(checkTicketPool, 500);
    })

    let checkTicketPool = () => {
        redis.llen(ticket.list, (err, reply) => {
            if (err) {
                console.error(err)
            } else {
                console.log("[pool reply] ", reply)
                let poollen = parseInt(reply)
                if (reply != null && poollen > 0) {
                    checkTicketStatus()
                }
            }
        })
    }

    let checkTicketStatus = () => {
        if (reslen === null) {
            redis.llen(ticket.resl, (err, reply) => {
                if (err) {
                    console.error(err)
                } else {
                    reslen = parseInt(reply)
                }
            })
        } else if (reslen > ticket.resLimit) {
            //
        } else {
            redis.lpop(ticket.list, (err, reply) => {
                if (err) {
                    console.error(err)
                } else if (reply != null) {
                    let obj = JSON.parse(reply)
                    if (obj != null && typeof obj === 'object' && obj.hasOwnProperty('phone')) {
                        redis.rpush(ticket.resl, reply)
                        redis.sadd(ticket.res, obj.phone)
                        reslen = null
                    } else {
                        console.error("Reply not an JSON string with phone number. [reply string] ", reply)
                    }
                }
            })
        }
    }


}

module.exports = _process
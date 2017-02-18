module.exports = {
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
module.exports = {
    id: 0,
    _key: 'ticket',
    _set: 'ticketSet',
    _res: 'ticketResult',
    _resl: 'ticketResList',
    _list: 'ticketList',
    get key() {
        return this._key + this.id
    },
    get set() {
        return this._set + this.id
    },
    get res() {
        return this._res + this.id
    },
    get resl() {
        return this._resl + this.id
    },
    get list() {
        return this._list + this.id
    }
}
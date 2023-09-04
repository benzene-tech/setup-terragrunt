export class Listener {
    private _buff: string[] ;

    constructor() {
        this._buff = []
    }

    get listener() {
        const listen = (data: any) => {
            this._buff.push(data)
        }

        return listen.bind(this)
    }

    get contents() {
        return this._buff.map(chunk => chunk.toString()).join(``)
    }
}

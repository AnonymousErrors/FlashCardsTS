const letters = `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ`
const numbers = `1234567890`
const characters = `${letters}${numbers}_`
export default {
    Random(min : number, max : number){
        let number = Math.floor(Math.random() * (max-min)) + min
        return number
    },
    RandomString(){
        let code = ``
        code = (Date.now() - 1).toString(36)
        for (let i = 0; i < 10; i++) {
            let arr = characters.split('')
            code = `${code}${arr[this.Random(0, arr.length - 1)]}`
        }
        return code
    },
    RandomGameID(){
        let code = ``
        for(let i = 0; i < 6; i++){
            let arr = letters.split('')
            code = `${code}${arr[this.Random(0, arr.length - 1)]}`
        }
        return code.toUpperCase()
    }
}
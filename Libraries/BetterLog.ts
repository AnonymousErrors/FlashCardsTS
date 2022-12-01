//import * as fs from 'fs/promises'
const util = require('util')
function AddZeroIfInexistent(input : number){
    let input_s = input.toString()
    if(input_s.length == 1)
        input_s = `0${input_s}`
    return input_s
}
function DateBuilder(){
    let date = new Date()
    let Hours = AddZeroIfInexistent(date.getHours())
    let Mins = AddZeroIfInexistent(date.getMinutes())
    let Seconds = AddZeroIfInexistent(date.getSeconds())

    return `${Hours}:${Mins}:${Seconds}`
}
let LogFile = './Output.log'
export default {
    /**
     * Used to specify the output logfile
     * @param PathToLogFile 
     */
    SetLogFile : (PathToLogFile : string) => {
        LogFile = PathToLogFile
    },
    Log : (...args : any[]) => {
        let prefix = `[${DateBuilder()} `
        if(args.length>1){
            prefix += args[0].toString()
            args.splice(0,1)
        }
        prefix += ']'
        let string_toformat = ''
        for(let i = 0; i < args.length; i++){
            switch(typeof args[i]){
                case 'string':
                    string_toformat += `\`${args[i]}\`, `
                    break;
                case 'object':
                    string_toformat += `${JSON.stringify(args[i])}, `
                    break;
                default:
                    string_toformat += `${args[i]}, `
                    break
            }
        }

        let finalString = `${prefix}: ${eval(`util.formatWithOptions({colors: true}, ${string_toformat})`)}`
        console.log(finalString)
        //fs.appendFileSync('./Output.log', finalString + '\n')
    }
}

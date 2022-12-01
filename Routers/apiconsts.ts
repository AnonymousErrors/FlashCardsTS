import EventEmitter from 'node:events'
import BetterLogM from '../Libraries/BetterLog'
import NameChecker from '../Libraries/NameChecker'
import Database from '../Database'
import * as interfaces from '../interfaces'
//import { emit } from 'node:process'
class MyEmitter extends EventEmitter {}
export const BetterLog = BetterLogM
export const OkName   = NameChecker
export const database = Database
export const isObject = (input : any) => input !== null && typeof input === 'object'
export const myEmitter = new MyEmitter();
export const sleep = (ms : number) => new Promise( (resolve) => setTimeout( () => resolve(true), ms) )
export const updatesHolder : object | any = {}
export const game_countdowns : any = {}
/**
 * 
 * @param {String} GameID 
 * @param {Number} addone 
 * @returns {{
 *      answered : boolean,
 *      amount   : number
 * }}
 */
export const questionAnswered = async (GameID : string, addone = 0) => {
    let gameInfo = await database.GetGame(GameID).catch(err => 
        {
            BetterLog.Log("ERROR", err) 
            return err
        }
    )
    if(!isObject(gameInfo))
        return gameInfo
    let game_players = JSON.parse(gameInfo.player_data)
    let Result = {
        answered : false,
        amount   : addone
    }
    for(let i = 0; i < game_players.players.length; i++){
        if(game_players.players[i].answered){
            Result.answered = true
            Result.amount   += 1
        }
    }
    // I swear if I find a data bigger than the player amount...
    if(Result.amount == game_players.players.length)
    {
        updatesHolder[GameID].everyoneAnswered = true
    }
    return Result
}
/**
 * Gets game data with the option "safe" to return secure info about players
 * @param {string} GameID 
 * @param {string} localplayer_id
 * @param {boolean} safe 
 * @returns {string | interfaces.GameData}
 */
export const GetGamePlayers  = async (GameID : string, localplayer_id : string, safe : boolean) => 
    new Promise( async (resolve, reject) => {
        let gameInfo = await database.GetGame(GameID).catch(err=>{
            BetterLog.Log("ERROR", err)
            return err
        })
        if(!isObject(gameInfo)){
            return `gamenotfound`
        }
        let questionInfo = await database.GetQuestion(gameInfo.question_id)
        .catch( (err) => { 
            BetterLog.Log("ERROR", err)
            return err
        })
        // How in the name of holy spirit is there no question?
        // Anyway handled
        if(!questionInfo)
        {
            return `questionnotfound`
        }
        let   playerInfo = JSON.parse(gameInfo.player_data)
        let playersData = []
        for(let i = 0; i < playerInfo.players.length; i++){
            let curr_plr = playerInfo.players[i]
            let id = curr_plr.id
            if(safe){
                curr_plr = {
                    name: curr_plr.name,
                    score: curr_plr.score,
                    correct: curr_plr.correct
                }
                if(id == localplayer_id)
                    curr_plr.id = id
            }
            playersData.push(curr_plr)
        }

        const toRet : interfaces.GameData = { 
            players : playersData, 
            question : questionInfo[0],
            countdowndata : game_countdowns[GameID],
            answers : undefined,
            type    : undefined
        }
        resolve(toRet)
    })
/**
 * Emits a global game change for the clients
 * @param {string} GameID 
 * @param {string} command 
 * @param {string} caller 
 * @returns {Boolean} Was command sent or not?
 */
export const emitGameChange = async (GameID : string, command : string, caller : string) => {
    BetterLog.Log('INFO', `Game change for ${GameID} emitted from ${caller}`)
    if(!updatesHolder[GameID])
        return BetterLog.Log('WARN', `Game ${GameID} is not initialized or broken...`)
    let exists = false
    let player_amount = -1
    while(myEmitter.listenerCount(`update_${GameID}`) < player_amount){
        
        const game_data : any = await database.GetGame(GameID).catch(err=>{
            BetterLog.Log("ERROR", err)
            return err
        })
        player_amount = JSON.parse(game_data.player_data).players.length
    }
    exists = myEmitter.emit(`update_${GameID}`, command)
    updatesHolder[GameID].amountUpdated = 0
    return exists
}
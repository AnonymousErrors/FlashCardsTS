import * as apiconsts from './apiconsts'
import express from 'express'
import * as interfaces from '../interfaces'
const router   = express.Router()
const AddGameUpdater = (GameID : string) => {
    apiconsts.game_countdowns[GameID] = {}
    apiconsts.updatesHolder[GameID] = {}
    apiconsts.updatesHolder[GameID].gameOnline = true;
    apiconsts.updatesHolder[GameID].amountUpdated = 0;
    apiconsts.updatesHolder[GameID].everyoneAnswered = false;
    apiconsts.updatesHolder[GameID].promise = new Promise(
            async (resolve) =>{
                let response = undefined
    //apiconsts.BetterLog.Log("INFO", apiconsts.updatesHolder[GameID])
                console.log()
                while(apiconsts.updatesHolder[GameID].gameOnline){
                    // Set random question
                    let SetQRes = await apiconsts.database.SetRandomGameQuestion(GameID)
                        .catch( (err : string) => {
                            apiconsts.BetterLog.Log("ERROR", err)
                        })
                    // Emit a game change
                    let sent = await apiconsts.emitGameChange(GameID, "NEW", 'Game Updater')
                    apiconsts.BetterLog.Log('INFO', `Sent the new update ${sent}`)
                    // Wait 25 seconds
                    for(let i = 25; i > 0; i--)
                    {
                        
                        apiconsts.game_countdowns[GameID].count = i
                        // Wait the thousand miliseconds
                        for(let k = 1000; k > 0; k--)
                        {
                            apiconsts.game_countdowns[GameID].time = k
                            await apiconsts.sleep(1)
                        }
                        // In case that all player have answered, end the game
                        if(apiconsts.updatesHolder.everyoneAnswered)
                        {
                            apiconsts.game_countdowns[GameID] = 
                            {
                                count: 25,
                                time: 1000
                            }
                            break
                        }
                    }
                    // Get and handle player info
                    let gameInfo : any = await apiconsts.GetGamePlayers(GameID, "", false)
                    if(typeof gameInfo === 'string')
                    {
                        response = gameInfo
                        break
                    }
                    if(gameInfo.players.length == 0)
                    {
                        response = "noplayers"
                        break
                    }
                    // Reset player stats
                    await apiconsts.emitGameChange(GameID, "SHOWANSWER", 'Game updater')
                    for(let i = 0; i < gameInfo.players.length; i++)
                    {
                        gameInfo.players[i].correct = undefined
                        gameInfo.players[i].answered = false
                        
                    }
                    await apiconsts.database.UpdatePlayer(GameID, gameInfo, true, "Game Updater")
    
                    await apiconsts.sleep(5000)
                }
    
                if(response)
                    await apiconsts.database.RemoveGame(GameID)
                resolve(response)
            }
        )
}

router.get('/gamestatus', async (req : any, res : any) => {
    let { gameid, player } = req.query
    apiconsts.myEmitter.once(`update_${gameid}`, async (command : string) => {
        apiconsts.BetterLog.Log("INFO", `Game ${gameid} received ${command}!`)

        let gameInfo : any = await apiconsts.GetGamePlayers(gameid, player, true)
        if(!apiconsts.isObject(gameInfo)){
            return res.status(200).send("Something went wrong while requesting playerinfo")
        }
        switch(command){
            case 'SHOWANSWER' : {
                const answers = await apiconsts.database.GetAnswer(gameInfo.question.id).catch(err =>{
                    return undefined
                })
                if(!answers || !Array.isArray(answers))
                    gameInfo.answers = "No answers were found"
                gameInfo.answers = answers    
                gameInfo.countdowndata = {
                    time: 1000,
                    count: 10
                }
                break
            }
            default:
                break
        }
        gameInfo.type = command
        apiconsts.updatesHolder[gameid].amountUpdated++;
        return res.status(200).send(gameInfo)
    })
})
router.get('/join',       async (req : any, res : any) => {
    res.render('join.ejs', { error : req.query.error || ""})
})
router.get('/play',       async (req : any, res : any) => res.redirect('/join'))
router.post('/play',      async (req : express.Request, res : express.Response) => {
    
    let { name, gameid } = req.body
    // if no nam,e
    if(!name){
        return res.send("A player name should be specified!")
    }
    name = apiconsts.OkName(name)
    if(name.length > 8)
        return res.redirect(`/join?error=${name}`)
    // if no gameid, make one
    let newGame = false
    
    if(!gameid){
        gameid = await apiconsts.database.AddGame().catch(err => {
            apiconsts.BetterLog.Log("ERROR", err)
            return undefined
        })
        if(!gameid){
            return res.redirect("/join?error=An error occured while creating the games")
        }
        newGame = true
    }
    
    // add the player
    let plr_res = await apiconsts.database.AddPlayer(gameid, {
        id       : "",
        name     : name,
        correct  : undefined,
//      host     : makeHost,
        score    : 0,
        answered : false
    })
    // error handling
    .catch(err => {
        apiconsts.BetterLog.Log("ERROR", err)
        return "Error adding you to the game"
    })
    if(!apiconsts.isObject(plr_res))
        return res.redirect(`/join?error=${plr_res}`)
    apiconsts.BetterLog.Log("INFO", plr_res)
    let gameInfo : any = await apiconsts.GetGamePlayers(gameid, plr_res.id, true)
    
    if(!apiconsts.isObject(gameInfo))
        return res.redirect(`/join?error=${gameInfo}`)
    gameInfo.type = 'NEWGAME'
    return res.render('play.ejs',{
        'game_id' : gameid, 
        'id'   : plr_res.id,
        'name' : name,
        //'host' : makeHost,
        'predata' : JSON.stringify(gameInfo)

    }, (err : any, html : string) => {
        apiconsts.emitGameChange(gameid, 'PLAYERCHANGED', 'Join')
        res.status(200).send(html)
        // set a 10 second timer to update the question
        if(newGame){
            AddGameUpdater(gameid)
        }
    })
})
router.get("/leave",      async(req : any, res : any)=>{
    let { gameid, player } = req.query 
    let leave_res = await apiconsts.database.RemovePlayer(gameid, player).catch(err=>{
        apiconsts.BetterLog.Log("ERROR", err)
        return err
    })
    apiconsts.emitGameChange(gameid, 'PLAYERCHANGED', 'Leave')
    if(leave_res == 'game_deleted')
        apiconsts.myEmitter.removeAllListeners(`update_${gameid}`)
    return res.send(leave_res)
})
export default router
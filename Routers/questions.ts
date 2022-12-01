import * as apiconsts from './apiconsts'
import express from 'express'
const router   = express.Router()
const server_conf = {
    hostname: "localhost",
    port: 3000,
    getbaseurl : function(){
        return `http://${this.hostname}:${this.port}`
    }
}
async function IsCorrectAnswer(questionid : string, answer : string){
    answer = answer.toLowerCase()
    let toret = false
    await apiconsts.database.GetQuestion(questionid).then(async (question_data) => {
        let answer_data : any = await apiconsts.database.GetAnswer(question_data[0].id)
        if(answer_data.length > 0)
            toret = answer_data[0].answer_text.toLowerCase() == answer
    })
    return toret
}
router.get('/checkgameanswer', async (req : any, res : any) => {
    let { gameid, playerid, answer } = req.query

    // Get Player Data
        let plr_res = await apiconsts.database.GetPlayer(gameid, playerid).catch( err => {
            apiconsts.BetterLog.Log("ERROR", err)
            return "Your player ID did not match any entry in the game"
        })
        if(typeof plr_res === 'string')
            return res.redirect(`/join?error=${plr_res}`)
        if(plr_res[0].answered)
            return res.send("Cannot answer twice!")
    // Get Player Data End

    // Game Info Handler
        let game_res = await apiconsts.database.GetGame(gameid).catch( err => {
            apiconsts.BetterLog.Log("ERROR", err)
            return "Game couldn't be found!"
        })
        if(typeof game_res === 'string')
            return res.redirect(`/join?error=${game_res}`)
    // Game Info Handler End
    plr_res[0].answered = true
    plr_res[0].correct = await IsCorrectAnswer(game_res.question_id, answer).catch( err => {
        apiconsts.BetterLog.Log("ERROR", err)
        return "Something went wrong!"
    })
    let questionData = await apiconsts.questionAnswered(gameid, 1)
    apiconsts.BetterLog.Log('ANSWER', questionData)
    if(typeof questionData === 'string')
        return res.send("Something went wrong while processing answer...")
    if(plr_res[0].correct)
        plr_res[0].score += 1
    if(!questionData.answered && plr_res[0].correct){
        plr_res[0].score += 1
    }
    if(typeof plr_res[0].correct === 'string')
        return res.send(plr_res[0].correct)
    let update_res = await apiconsts.database.UpdatePlayer(gameid, plr_res[0], false, "Answer Handler").catch( err => {
        apiconsts.BetterLog.Log("ERROR", err)
        return "Failed to update player"
    })
    apiconsts.emitGameChange(gameid, "", "Answer receiver")
    let gameInfo = await apiconsts.GetGamePlayers(gameid, playerid, true)
    return res.send(gameInfo)

})
router.get('/addquestion',     async (req : any, res : any) => {
    let { question, answer, secret } = req.query
    
    if(secret != "cookies" || !question || !answer)
        return res.redirect("/")
    const question_res = await apiconsts.database.AddQuestion({
        Question: question,
        Answer : answer
    }).catch((err) => {
        apiconsts.BetterLog.Log("ERROR", err)
        return {err: "Something went terribly wrong"}
    })
    if(req.headers.referer)
        return res.redirect(req.headers.referer)
    return res.send(question_res.err ? question_res.err : question_res)
})
router.get('/checkanswer',     async (req : any, res : any) => {
    let { id, answer } = req.query
    if(!id || !answer)
        return res.send("A question id and an answer should be specified!")
    // Get the question
    const question = await fetch(`${server_conf.getbaseurl()}/getquestion?id=${id}`)
    .then(async ( res ) => await res.json())
    .catch(err=>{
        apiconsts.BetterLog.Log("ERROR", err)
        return {}
    })
    // Get the answer
    const answer_db = (await apiconsts.database.GetAnswer(question.id).catch(err=>{
        apiconsts.BetterLog.Log("ERROR", err)
        return undefined
    }))
    if(!Array.isArray(answer_db))
        return res.send("No answers were found?")
    if(answer_db.length < 1)
        return res.send("No answers were found?")
    let correct = false
    answer = answer.toLocaleLowerCase().trim()
    const foundAnswers = answer_db.find(value => value.answer_text.toLocaleLowerCase().trim() == answer);
    if(foundAnswers)
        correct = true
    return res.json({ 
        word : answer_db[0].answer_text,
        correct : correct
    })

})
router.get('/getquestion',     async (req : any, res : any) => {
    let { id } = req.query
    if(!id)
        return res.json({})
    const questions = await apiconsts.database.GetQuestion(id).catch(err=>{
        apiconsts.BetterLog.Log("ERROR", err)
        return [{}] // who's lazy to do this in a more mannered... way? ofc not me
    })
    res.send(questions[0])
})
router.get('/randomquestion',  async (req : any, res : any) => {
    const response = await apiconsts.database.GetRandomQuestion().catch(err=>{
        apiconsts.BetterLog.Log("ERROR", err)
        return {}
    })
    res.json(response)
})
export default router
import mysql from 'mysql'
import BetterLog from './Libraries/BetterLog'
import Random from './Libraries/Random'
import * as interfaces from './interfaces'
const connection = mysql.createConnection({
    host     : "localhost",
    user     : "root",
    password : "temppwd69",
    port     : 3306
})
const DB_Names = {
    Answers   : 'questions.answers',
    Questions : 'questions.questions',
    Games     : 'main.games'

}
const Queries = {
    /*
    *  Answers
    */
    AddAnswer         : `INSERT   INTO ${DB_Names.Answers  } ( id, question_id, answer_text) VALUES( ?, ?, ? )`,
    GetAnswer         : `SELECT * FROM ${DB_Names.Answers  } WHERE question_id = ?`,
    /*
    *  Questions
    */
    AddQuestion       : `INSERT   INTO ${DB_Names.Questions} ( id, question ) VALUES( ?, ? )`,
    GetQuestion       : `SELECT * FROM ${DB_Names.Questions} WHERE id = ?`,
    GetQuestions      : `SELECT * FROM ${DB_Names.Questions}`,
    /*
    * Games
    */
    AddGame           : `INSERT   INTO ${DB_Names.Games    } ( id, player_data, question_id ) VALUES ( ?, ?, ? )`,
    GetGame           : `SELECT * FROM ${DB_Names.Games    } WHERE id = ?`,
    RemoveGame        : `DELETE   FROM ${DB_Names.Games    } WHERE id = ?`,
    SetGameQuestion   : `UPDATE        ${DB_Names.Games    } SET question_id = ? WHERE id = ?`,
    UpdateGamePlayers : `UPDATE        ${DB_Names.Games    } SET player_data = ? WHERE id = ?`
}
const NewGameDefaultJSON = JSON.stringify({ players: [] })
connection.connect((err : string) => {
    if (err) {
        BetterLog.Log("ERROR", "Warning: Could not connect to database.");
    }
    BetterLog.Log("INFO", "Database working on port 3306")
})
let defaultCB = (resolve : any, reject : any, err : any, res : any) => {
    if(err){
        BetterLog.Log('ERROR', err)
        reject("Aw, something went wrong...")
    }
    resolve(res)
}

class Database{
    con              = connection;
    lastRandQuestion = -1;
    constructor(){}
    /**
     * An async query function for mysql
     * 
     * @param {string} query The mysql query to be executed 
     * @param {any} args The arguments for the query, replacing `?` symbols
     * @param {any} custom_res The custom response to be given as a successful operation
     * @returns {any}
     */
    Query = async (query : string, args : any, custom_res : any = undefined) => 
        new Promise((resolve, reject) => 
            this.con.query(
                query, 
                args,
                (err : any, res : any) =>
                    defaultCB(resolve, reject, err, custom_res ?? res)
            )
        )
        
    /**
     * Adds an answer to the question in the database with given id
     * 
     * @param {string} Answer 
     * @param {string} QuestionID 
     * @returns
    */

    AddAnswer = async (Answer : string, QuestionID : string) : Promise<any> =>
        this.Query(
            Queries.AddAnswer, 
            [Answer, QuestionID, Answer], 
            "OK"
        )
    /**
     * Adds a question with the optional parameter to not add the answer as question
     * @param {Question} Question_Data 
     * Question_Data : { Question : string, Answer   : string
     * }
     * @param {boolean} recursive 
     * @returns 
     */
    AddQuestion = async (Question_Data : interfaces.Question, recursive : boolean = true) : Promise<any> =>
        new Promise( async(resolve, reject) => {
            const Question_ID = Random.RandomString()
            let Query_Response = await this.Query(
                Queries.AddQuestion,
                [Question_ID, Question_Data.Question],
                "OK"
            ).catch((err) => err)
            if(Query_Response == "OK"){
                // Add the answer
                const Answer_Res = await this.AddAnswer(
                    Question_Data.Answer, 
                    Question_ID
                ).catch((err) => err)
                if(Answer_Res == "OK"){
                    // if given, add the reverse question
                    if(recursive){
                        await this.AddQuestion(
                            { Question : Question_Data.Answer, Answer : Question_Data.Question}, 
                            false
                        ).catch((err) => { 
                            Query_Response = err 
                        })
                    }
                }
            }
            defaultCB(resolve, reject, Query_Response, "OK")
        }
    )
    /**
     * Gets question data from the database
     * @param {String} QuestionID 
     * @returns 
     */
    GetQuestion = async (QuestionID : string) : Promise<any> =>
        this.Query(
            Queries.GetQuestion,
            [ QuestionID ]
        )
    /**
     * Gets answer data from the database
     * @param {string} QuestionID 
     * @returns 
     */
    GetAnswer = async (QuestionID : string) =>
        this.Query(
            Queries.GetAnswer, 
            [ QuestionID ]
        )
    /**
     * Gets a random question from the database
     * @returns 
     */
    GetRandomQuestion = async () =>
        new Promise<interfaces.Question_DB | string>( async (resolve, reject) => {
            const Questions : any = await this.Query(Queries.GetQuestions, [])
                                .catch((err) => err)
            if(typeof Questions !== 'object')
                return reject("Aw, something went wrong...")
            let randNum = this.lastRandQuestion
            while(this.lastRandQuestion == randNum)
            {
                randNum = Random.Random(0, Questions.length - 1)
            }
            const Question : interfaces.Question_DB = Questions[randNum]    
            resolve(Question)
        })
    /**
     * Adds a blank game to the database
     * @returns Game ID
     */
    AddGame = async () =>
        new Promise(async (resolve, reject) => {
            const Game_ID = Random.RandomGameID()
            const Query_Res = await this.Query(
                Queries.AddGame,
                [Game_ID, NewGameDefaultJSON, "INIT"],
                "OK"
            ).catch(err => err)

            defaultCB(
                resolve,
                reject,
                Query_Res != "OK",
                Game_ID
            )
        })
    /**
     * Gets the game data from the database
     * @param {String} Game_ID 
     * @returns 
     */
     GetGame = async (Game_ID : string) =>
        new Promise<interfaces.Game | string>(async (resolve, reject) => {
            const Query_Res : any = await this.Query(
                Queries.GetGame, 
                [ Game_ID.toUpperCase() ]
            ).catch(err => err)
                
            defaultCB(
                resolve,
                reject,
                typeof Query_Res !== 'object' ? Query_Res : undefined,
                Query_Res[0]
            )
        })
    /**
     * Removes a game from the database
     * @param {string} Game_ID 
     * @returns 
     */
    RemoveGame = async (Game_ID : string) =>
        this.Query(
            Queries.RemoveGame, 
            [ Game_ID ], 
            "Game successfully deleted"
        )
    /**
     * Removes the game from the database
     * @param {string} Game_ID 
     * @returns 
     */
    async SetRandomGameQuestion(Game_ID : string){
        return new Promise( async (resolve, reject) => {
            const Question = await this.GetRandomQuestion()
            .catch((err) => err)
            if(typeof Question !== 'object'){
                BetterLog.Log("ERR", "Set Rand Q", Question)
                return reject("Internal error occured")
            }
            const Query_Res = await this.Query(
                Queries.SetGameQuestion,
                [ Question.id, Game_ID ],
                "OK"
            )
            defaultCB(
                resolve,
                reject,
                Query_Res != "OK",
                "OK"
            )
        })
    }
    /**
     * Gets a player from the database, as well as all player data
     * @param {string} Game_ID 
     * @param {string} player_id 
     * @returns `[player, game_players]`
     */
    async GetPlayer(Game_ID : string, player_id : string){
        return new Promise<Array<any>>( async (resolve, reject)=>{
            const game_data = await this.GetGame(Game_ID).catch(err=>{
                BetterLog.Log("ERROR", err)
                return "failed"
            })
            if(typeof game_data === 'string')
                return reject("The requested game wasn't found!")
            
            let game_players = JSON.parse(game_data.player_data)
            let player : interfaces.Player = game_players.players.find((player : interfaces.Player) => player.id == player_id)
            if(!player)
                return reject("The requested player wasn't found!")
            resolve([player, game_players])
        })
    }
    /**
     * Adds player to the game
     * @param {string} Game_ID 
     * @param {Player} player_data 
     * Player : { name : string, score : number, host : boolean, answered : boolean, correct : boolean }
     * @returns 
     */
    async AddPlayer(Game_ID : string, player_data : interfaces.Player){
        return new Promise<any>(async (resolve, reject) => {
            player_data.id = Random.RandomString()
            // fetch game data
            const game_data = await this.GetGame(Game_ID)
            .catch(err=>{
                BetterLog.Log("ERROR", err)
                return err
            })
            // game id checker
            if(typeof game_data == 'string')
                return resolve("Invalid game id")

            let game_players = JSON.parse(game_data.player_data)
            // handle existent players
            const plr_found = game_players.players
                .find((player : interfaces.Player) => player.name.toLowerCase() == player_data.name.toLowerCase())
            if(plr_found)
                return resolve("This player is already in the game")
            /* Handle host
            player_data.host = game_players.players.find(player => player.host == true) ?? false*/
            game_players.players.push(player_data)
            // Query
            const Query_Res = await this.Query(
                Queries.UpdateGamePlayers,
                [JSON.stringify(game_players), Game_ID],
                "OK"
            ).catch(err => err)
            if(Query_Res !== "OK"){
                BetterLog.Log("ERR", Query_Res)
                return reject("Couldn't add the player to the game...")
            }
            return resolve({id : player_data.id})
        })
    }
    /**
     * Updates a player or all players in the game
     * @param {string} Game_ID 
     * @param {Player | PlayerData} player_data 
     * `player_data : Player[]` or `player_data : Player`
     * @param {boolean} insert_all 
     * @param {any} calledfrom 
     * @returns 
     */
    async UpdatePlayer(Game_ID : string, player_data : any,  insert_all : boolean = false, calledfrom : any = undefined){
        /*BetterLog.Log('INFO', Game_ID, ` received an update player/s signal, player data: `, 
                              player_data, 
                              `\nAll players update: ${insert_all ? "yes" : "no"}; Caller: ${calledfrom}`)*/
        return new Promise<string>(async (resolve, reject) => {
            let game_info = undefined
            if(!insert_all){
                game_info = await this.GetPlayer(Game_ID, player_data.id).catch(err=>{
                    BetterLog.Log("ERROR", err)
                    return "playernotfound"
                })
                if(typeof game_info == "string")
                    reject(game_info)

                let plr_idx = game_info[1].players.indexOf(game_info[0])
                game_info[1].players[plr_idx] = player_data
            }
            else{
                game_info = [
                    'updated_all',
                    { players: player_data.players }
                ]
            }
            const Query_Res = await this.Query(
                Queries.UpdateGamePlayers,
                [JSON.stringify(game_info[1]), Game_ID],
                "OK"
            ).catch(err => err)
            if(Query_Res !== "OK"){
                BetterLog.Log("ERR", Query_Res)
                return reject("Couldn't add the player to the game...")
            }
            return resolve("OK")
        })
    }
    /**
     * Removes a player from the game
     * @param {string} Game_ID 
     * @param {string} player_id 
     * @returns 
     */
    async RemovePlayer(Game_ID : string, player_id : string){
        return new Promise( async (resolve, reject)=>{
            let player_info = await this.GetPlayer(Game_ID, player_id).catch(err=>{
                BetterLog.Log("ERROR", err)
                return "playernotfound"
            })
            if(typeof player_info == "string")
                return reject(player_info)
            
            let plr_idx =  0
            console.log(player_info)
            if(Array.isArray(player_info[0].players)){
                player_info[1].players.indexOf(player_info[0])
                player_info[1].players.pop(plr_idx)
            }
            else{
                player_info[1].players = new Array(0)
            }

            if(player_info[1].players.length == 0){

            }
            const Query_Res = await this.Query(
                Queries.UpdateGamePlayers,
                [JSON.stringify(player_info[1]), Game_ID],
                "OK"
            ).catch(err => err)
            if(Query_Res !== "OK"){
                BetterLog.Log("ERR", Query_Res)
                return reject("Couldn't add the player to the game...")
            }
            return resolve("OK")
        })
    }
}
export default new Database();

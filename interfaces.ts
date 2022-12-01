export interface Player {
    id       : string,
    name     : string,
    score    : number,
    // for future host     : boolean, 
    answered : boolean,
    correct  : any
}
export interface PlayerData {
    players : Player[]
}
export interface Game {
    id: string,
    player_data: string,
    question_id: string
}
export interface Question_DB {
    id : string,
    question : string
}
export interface Question {
    Question : string,
    Answer   : string       
}
export interface Countdown {
    time: number,
    count: number
}
export interface GameData {
    players       : Player[],
    question      : Question,
    countdowndata : any,
    answers       : any,
    type          : any
}
export interface GameBackData{
    gameOnline       : string,
    amountUpdated    : number,
    everyoneAnswered : boolean,
    promise          : Promise<unknown>
}
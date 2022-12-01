
//import fs from 'fs'
import path from 'path'
import multiparty from 'multiparty'
import express from 'express'
import BetterLog from './Libraries/BetterLog'

import game_api from './Routers/game_api'
import question_api from './Routers/questions'
//console.log(game_api)
const app          = express()
const server_conf = {
    hostname: "localhost",
    port: 3000,
    getbaseurl : function(){
        return `http://${this.hostname}:${this.port}`
    }
}

BetterLog.SetLogFile(path.join(__dirname, 'Output.log'))

app.set('views', path.join(__dirname, '/ejsstuff'))
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/frontend'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use( (req : any, res : any, next : any) => {
    res.header("Access-Control-Allow-Origin", "postrequestslink"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
})
app.get('/*', (req : any, res : any, next : any) => {
    next()
})

app.use('/', game_api)
app.use('/', question_api)
/*
app.post("/upload", (req, res) =>{
    var form_data = new multiparty.Form();
    form_data.parse(req, (err, fields, files) => {
        if(err)
            BetterLog.Log("ERROR", err)
        BetterLog.Log("INFO", files.thefile[0].path)
        fs.copyFileSync(files.thefile[0].path, `./files/${files.thefile[0].originalFilename}`)
        res.redirect("/addfile")
    });
})*/
app.get("/lol", (req : express.Request, res : express.Response) => {
    res.download("SOME STUFFXSWW")
})
app.get("/addfile", (req : any, res : any) => {
    res.render("addfile.ejs", { msg: req.query.msg || "Upload files!"}, (err : string , string : string)=>{
        res.send(string)
    })
})

const httpServer = app.listen(server_conf, () =>{
    BetterLog.Log('START', `Server started on ${server_conf.getbaseurl()}`)
})
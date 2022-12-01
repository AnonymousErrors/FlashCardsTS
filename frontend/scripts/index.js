let background = document.getElementById("background")
let { question, score } = background.children
let { submit, answer } = background.children.action_stuff.children 
let Current_Asking = {
    id: "",
    question: "Unset"
}
let Score = {
    Correct: 0,
    Wrong: 0
}
let sleep = async(ms) => new Promise( (resolve) => setTimeout(() => resolve(true), ms))
let GetRandomQuestion = async () => {
    const question_data = await fetch(`/randomquestion`).then(async(res)=>await res.json())
    answer.value = "" 
    Current_Asking = question_data
    question.innerText = Current_Asking.question
}
document.body.onload = async(Ev) =>{
    let modal = undefined
    while(true){
        Swal.close(modal)
        await GetRandomQuestion()
        await sleep(7500)
        let response = await fetch(`/checkanswer?id=${Current_Asking.id}&answer=anyanswer1234`).then(async(res) =>{
            return await res.json();
        }).catch( (err) => {
            console.log(err)
            return { correct : false}
        })
        modal = Swal.fire({html:`<img src="/gut_man.png"><br>The answer was <b>${response.word}</b>`})
        await sleep(2000)
    }
}
/*
document.body.onload = async(Ev) => {
    answer.focus()
    await GetRandomQuestion()
    let ClickButtonEvent = async (Ev) => {
        if(answer.value.length<2)
            return;
        let response = await fetch(`/checkanswer?id=${Current_Asking.id}&answer=${answer.value}`).then(async(res) =>{
            return await res.json();
        }).catch( (err) => {
            console.log(err)
            return { correct : false}
        })
        if(response.correct){
            Score.Correct++;
            Swal.fire({
                html: ``
            })
            await(5000)
            Swal.close()
            await GetRandomQuestion()
        }
        else{
            Score.Wrong++;
            Swal.fire({title:"Time out!", html:`<img src="/gut_man.png"><br>The answer was <b>${response.word}</b>`})
            await(3000)
            Swal.close()
            await GetRandomQuestion()
        }
        score.innerText = `Correct: ${Score.Correct}\tWrong: ${Score.Wrong}`
        
    }
    while(await Sleep(5000)){
        ClickButtonEvent()
    }
    document.body.onkeyup = async(ev) =>{
        switch(ev.key){
            case "Enter":{
                await ClickButtonEvent()
                break;
            }
            default: {
                break;
            };
        }
    }
    //submit.onclick = ClickButtonEvent
}*/
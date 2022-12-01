let { question, answer, submit, secret } = document.getElementById("background").children
let AddQuestion = async(secret, question, answer) => {
    return await fetch(
        `/addquestion?secret=${secret}&question=${question}&answer=${answer}`
    ).catch( (err) =>{
        console.log(err)
        return { err : "Something went wrong"}
    }).then(async(res) =>await res.json())
}
let ClickButtonEvent = async (Ev) => {
    let response = await fetch(
        `/addquestion?secret=${secret.value}&question=${question.value}&answer=${answer.value}`
    ).catch( (err) =>{
        console.log(err)
        return { err : "Something went wrong"}
    }).then(async(res) =>await res.json())
    
    let response1 = await fetch(
        `/addquestion?secret=${secret.value}&question=${answer.value}&answer=${question.value}`
    ).catch(err=>{
        console.log(err)
        return { err : "Something went wrong"}
    }).then(async(res) =>await res.json())

    if(response.err || response1.err)
        return await Swal.fire("Oops!", response.err, "error")
    
    await Swal.fire("Success!", "The question was successfully added", "success")
}
document.body.onload = async (Ev) =>{
    //submit.onclick = ClickButtonEvent
    document.body.onkeyup = async(ev) =>{
        switch(ev.key){
            case "Enter":{
                await ClickButtonEvent()
                break;
            }
            default: break;
        }
    }
}
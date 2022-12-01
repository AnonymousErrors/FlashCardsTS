let Allowed = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_"
const MinLength = 3
const MaxLength = 24
export default function(name : string) {
    name = name.trim()
    if(name.length < MinLength || name.length > MaxLength)
        return `Name must be withing ${MinLength} and ${MaxLength} characters`
    let cool = true
    for(let i = 0; i < name.length; i++){
        if(!Allowed.includes(name[i])){
            cool = false
            break
        }
    }
    return cool ? name : "Invalid name provided, only letters, numbers and underscore allowed"
}

import fsm from "./samples/tcpfsm.js" 


await fsm.transition("Connecting")
await fsm.transition("Connected")
await fsm.transition("Disconnecting")
await fsm.transition("Disconnected")

console.log("transition = ","transition" in fsm)
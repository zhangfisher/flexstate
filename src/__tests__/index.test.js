
import fsm from "../samples/tcpfsm" 
import { delay } from "../utils"

fsm.log=()=>{}
beforeAll(()=>{
 
    
})


test("同步状态切换", async function(){    
    await fsm.transition("Connecting")
    expect(fsm.CURRENT).toBe(fsm.CONNECTING)
    await fsm.transition("Connected")
    expect(fsm.CURRENT).toBe(fsm.CONNECTED)
    await fsm.transition("Disconnecting")
    expect(fsm.CURRENT).toBe(fsm.DISCONNECTING)
    await fsm.transition("Disconnected")
    expect(fsm.CURRENT).toBe(fsm.DISCONNECTED)  
})

test("执行动作", async function(){    
    await fsm.connect()  
    expect(fsm.CURRENT).toBe(fsm.DISCONNECTED)
})

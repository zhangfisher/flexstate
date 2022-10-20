import { FlexStateMachine,state,StateMachineError,FinalStateError } from "../"
import { delay } from "../utils"
import { expect, test, beforeEach } from 'vitest'


class TcpClientStateMachine extends FlexStateMachine {
    static states ={
        Initial:{
            initial: true,
            value:0,
            next:["Connecting","Disconnected"]
        },
        Connecting: {
            value:1,
            next:["Connected","Disconnected"]
        },
        Connected:{
            value:2,
            next:["Disconnecting","Disconnected"]
        },
        Disconnecting:{
            value:3,
            next:["Disconnected"]
        },
        Disconnected:{
            value:4,
            next:["Connecting"]
        } 
    }
}

describe("状态机",()=>{   
    test("启动状态机",async ()=>{
        const fsm = new FlexStateMachine({
            autoStart:false,
            states:{
                A:{value:1,initial:true},
                B:{value:2},
                C:{value:3},
            }
        })
        const startCallback = jest.fn();
        fsm.on("start",startCallback)
        expect(fsm.running).toBeFalsy()
        expect(fsm.current.name).toBe(null)
        await fsm.start()
        expect(fsm.current.name).toBe("A")
        expect(fsm.running).toBeTruthy()      
        expect(startCallback.mock.calls.length).toBe(1);
        expect(startCallback).toHaveBeenCalled();
    })

    test("停止状态机",async ()=>{
        const fsm = new FlexStateMachine({
            states:{
                A:{value:1,initial:true},
                B:{value:2},
                C:{value:3},
            }
        })
        const stopCallback = jest.fn();
        fsm.on("stop",stopCallback)
        await fsm.waitForInitial() 
        await fsm.stop()
        expect(fsm.current.name).toBe(null)
        expect(fsm.running).toBeFalsy()      
        expect(stopCallback.mock.calls.length).toBe(1);
        expect(stopCallback).toHaveBeenCalled();
    })

    test("启动后进入初始化状态失败后状态机停止",async () => {
        let e = new Error()
        const fsm = new FlexStateMachine({
            autoStart:false,
            states:{
                A:{
                    value:1,
                    enter:()=>{throw e},  // 进入A状态出错,导致不能切换到初始状态
                    initial:true,
                },                    
                B:{value:2},
                C:{value:3},
            }
        })
        const stopCallback = jest.fn();
        fsm.on("stop",stopCallback)        
        await fsm.start()
        expect(fsm.current.name).toBe(null)
        expect(fsm.running).toBeFalsy()      
        expect(stopCallback.mock.calls.length).toBe(1);
        expect(stopCallback).toHaveBeenCalled();
        expect(stopCallback).toHaveBeenCalledWith(e);        
    })

})
 
describe("状态转换",()=>{   

    test("正常状态切换",async () => {
        let beginStates = [], endStates = [] 
        const fsm = new TcpClientStateMachine({
            onTransitionBegin:({from,to}) => {
                beginStates.push(to)
            },
            onTransitionEnd:({from,to}) => {
                endStates.push(to)
            }        
        })
        // 等状态机进入初始化状态
        await fsm.waitForState("Initial")
        expect(fsm.current.name).toBe("Initial")    //
        await fsm.transition("Connecting")
        expect(fsm.current.name).toBe("Connecting") 
        await fsm.transition("Connected")
        expect(fsm.current.name).toBe("Connected") 
        await fsm.transition("Disconnecting")     
        expect(fsm.current.name).toBe("Disconnecting") 
        await fsm.transition("Disconnected")
        expect(fsm.current.name).toBe("Disconnected") 

        const expectStates = ["Initial","Connecting","Connected","Disconnecting","Disconnected"]
        expect(beginStates.length).toBe(5)
        expect(beginStates).toStrictEqual(expectStates)
        expect(endStates.length).toBe(5)
        expect(endStates).toStrictEqual(expectStates)
    })

    test("侦听状态切换事件",async () => {
        const actualEvents = []
        const expectEvents = [
            "onInitialLeave","Initial/leave",
            "onConnectingEnter","Connecting/enter",
            "onConnectingDone","onConnecting","Connecting/done"
        ]
        class MyTcpClient extends TcpClientStateMachine{
            onInitialLeave(){
                actualEvents.push("onInitialLeave") 
            }
            onConnectingEnter(){
                actualEvents.push("onConnectingEnter") 
            }
            onConnectingDone(){actualEvents.push("onConnectingDone") }   // onConnectingDone与onConnecting均是订阅的Connecting/done
            onConnecting(){actualEvents.push("onConnecting") }
        }
        const fsm = new MyTcpClient()    
        await fsm.waitForState("Initial")    
        fsm.once("Initial/leave",()=>actualEvents.push("Initial/leave"))
        fsm.once("Connecting/enter",()=>actualEvents.push("Connecting/enter"))
        fsm.once("Connecting/done",()=>actualEvents.push("Connecting/done"))
        // 切换到
        await fsm.transition("Connecting")
        expect(actualEvents).toStrictEqual(expectEvents)
    })



    test("切换到错误的状态",async () => {
        const actualEvents = []
        const expectEvents = ["onTransitionBegin","onTransitionEnd","onTransitionCancel"] // 第一个事件是进入初始化时触发的
        const fsm = new TcpClientStateMachine({
            onTransitionBegin:({from,to})=>{
                actualEvents.push("onTransitionBegin")
            },
            onTransitionCancel:({from,to})=>{
                actualEvents.push("onTransitionCancel")
            },
            onTransitionEnd:({from,to})=>{
                actualEvents.push("onTransitionEnd")
            }
        })    
        await fsm.waitForState("Initial") 
        fsm.once("Initial/leave",()=>actualEvents.push("Initial/leave")) 
        try{
            await fsm.transition("Connected") 
        }catch(e){
            expect(e).toBeInstanceOf(StateMachineError)
            expect(actualEvents).toStrictEqual(expectEvents)
        }
    })


    test("在状态切换事件中阻止切换",async () => {
        const actualEvents = []
        const expectEvents = ["Initial/leave","onConnectingEnter"]
        class MyTcpClient extends TcpClientStateMachine{
            onConnectingEnter(){
                actualEvents.push("onConnectingEnter")
                throw new Error()               // 触发发事件将导致状态无法切换至
            } 
        }
        const fsm = new MyTcpClient()    
        await fsm.waitForState("Initial")    
        fsm.once("Initial/leave",()=>actualEvents.push("Initial/leave")) 
        // 切换到
        try{
            await fsm.transition("Connecting")
        }catch(e){            
            expect(actualEvents).toStrictEqual(expectEvents)
            expect(actualEvents.length).toBe(2)
            expect(fsm.CURRENT).toBe(fsm.INITIAL)
            expect(fsm.current.name).toBe(fsm.states.Initial.name)
            expect(e).toBeInstanceOf(StateMachineError)
        }
        
    })



    test("在状态定义中侦听状态切换事件以及无效转换",async () => {
        const actualEvents = []
        const expectEvents = [
            "onTransitionBegin","A/enter","A/done","onTransitionEnd",   // Initial
            "onTransitionBegin","A/leave","B/enter","B/done","onTransitionEnd",  // A->B
            "onTransitionBegin","B/leave","C/enter","C/done","onTransitionEnd",  // B->C
            "onTransitionCancel"  // C->B 由于C只能被切换至 
        ]

        const fsm  = new FlexStateMachine({
            onTransitionBegin:()=>actualEvents.push("onTransitionBegin"),
            onTransitionEnd:()=>actualEvents.push("onTransitionEnd"),
            onTransitionCancel:()=>actualEvents.push("onTransitionCancel"),
            states:{
                A:{
                    value:1,
                    initial:true,
                    enter:()=>actualEvents.push("A/enter"),
                    leave:()=>actualEvents.push("A/leave"),
                    done:()=>actualEvents.push("A/done"),
                    next:["B"]

                },
                B:{
                    value:2,
                    enter:()=>actualEvents.push("B/enter"),
                    leave:()=>actualEvents.push("B/leave"),
                    done:()=>actualEvents.push("B/done"),
                    next:"C"
                },
                C:{
                    value:3,
                    enter:()=>actualEvents.push("C/enter"),
                    leave:()=>actualEvents.push("C/leave"),
                    done:()=>actualEvents.push("C/done"),
                    next:["A"]
                }

            }
        }) 
        await fsm.waitForState("A")         
        expect(fsm.current.name).toBe("A")
        await fsm.transition("B")
        expect(fsm.current.name).toBe("B")
        await fsm.transition("C")
        expect(fsm.current.name).toBe("C")
        try{
            await fsm.transition("B")   // C只能切换到A，因此此操作会出错
        }catch (e) {
            expect(e).toBeInstanceOf(Error)
        }
        expect(fsm.current.name).toBe("C")
        expect(actualEvents).toStrictEqual(expectEvents)
    })

    test("异步转换回调事件",async () => {
        const actualEvents = [] // A,B,C,A,B,C,.....
        const expectEvents = ["A","B","C"]
        const expecteCallbackResults = []
        const fsm  = new FlexStateMachine({
            onTransitionEnd:({from,to})=>actualEvents.push(to),
            states:{
                A: { 
                    value: 1, 
                    initial: true, 
                    done: async () => {
                        await delay(5);
                        return "A"
                    }, 
                    next: ["B"] },
                B: { value: 2, done: async () => {
                    await delay(5);
                    return "B"
                    }, next: "C" },
                C: { value: 3, done: async () =>  {
                    await delay(5);
                    return "C"
                    }, next: ["A"] }
            }
        }) 
        await fsm.waitForState("A")    
        expect(fsm.current.name).toBe("A") 
        await fsm.transition("B")
        expect(fsm.current.name).toBe("B")
        await fsm.transition("C")
        expect(fsm.current.name).toBe("C") 
        expect(actualEvents).toStrictEqual(expectEvents)
    })

    test("多个异步转换回调事件", async () => {
        const actualEvents = [] 
        const onStateEvent = event => async () => { await delay(1); actualEvents.push(event) }
        class MyStateMachine extends FlexStateMachine {
            async onAEnter() { await onStateEvent("onAEnter")() }
            async onALeave() { await onStateEvent("onALeave")() }
            async onADone() { await onStateEvent("onADone")() }
            async onBEnter() { await onStateEvent("onBEnter")() }
            async onBLeave() { await onStateEvent("onBLeave")() }
            async onBDone() { await onStateEvent("onBDone")() }
            async onCEnter() { await onStateEvent("onCEnter")() }
            async onCLeave() { await onStateEvent("onCLeave")() }
            async onCDone() { await onStateEvent("onCDone")() }
        }
        const fsm = new MyStateMachine({
            autoStart:false,
            states: {
                A        : {
                    value: 1, initial: true,
                    enter: onStateEvent("A.Enter"),
                    leave: onStateEvent("A.Leave"),
                    done : onStateEvent("A.Done") ,
                    next : ["B"]
                },
                B        : {
                    value: 2,
                    enter: onStateEvent("B.Enter") ,
                    leave: onStateEvent("B.Leave"),
                    done : onStateEvent("B.Done") ,
                    next : "C"
                },
                C        : {
                    value: 3,
                    enter: onStateEvent("C.Enter") ,
                    leave: onStateEvent("C.Leave"),
                    done : onStateEvent("C.Done") ,
                    next : ["A"]
                }
            }
        })
        fsm.on("A/enter", onStateEvent("A/Enter"))
        fsm.on("A/leave", onStateEvent("A/Leave"))
        fsm.on("A/done", onStateEvent("A/Done"))

        fsm.on("B/enter", onStateEvent("B/Enter"))
        fsm.on("B/leave", onStateEvent("B/Leave"))
        fsm.on("B/done", onStateEvent("B/Done"))
        // 
        fsm.on("C/enter", onStateEvent("C/Enter"))
        fsm.on("C/leave", onStateEvent("C/Leave"))
        fsm.on("C/done", onStateEvent("C/Done"))

        fsm.start()
        await fsm.waitForState("A")
        await fsm.transition("B")
        await fsm.transition("C")

        // 生成状态从from切换到to应该触发的事件名称数组
        const getTransitionEvents = (from, to) => {
            let events = []
            if (from) events.push(...[ `${from}.Leave`,`on${from}Leave`, `${from}/Leave`])
            events.push(...[
                `${to}.Enter`, `on${to}Enter`, `${to}/Enter`,
                `${to}.Done`,`on${to}Done`,  `${to}/Done`
            ])
            return events
        }
        const expectEvents = [
            ...getTransitionEvents(null, "A"),
            ...getTransitionEvents("A", "B"),
            ...getTransitionEvents("B", "C")
        ]
        //await fsm.waitFor("C/done")
        setTimeout(() =>expect(actualEvents).toStrictEqual(expectEvents),1000)
        
    })

    test("连续多次转换状态",async () => {
        const actualEvents = [] // A,B,C,A,B,C,.....
        const expectEvents = [ ]
        const fsm  = new FlexStateMachine({
            onTransitionEnd:({from,to})=>actualEvents.push(to),
            states:{
                A: { value: 1, initial: true, done: async () => {
                    await delay(10);
                    return "A"
                    }, next: ["B"] },
                B: { value: 2, done: async () =>  {await delay(10);return "B"}, next: "C" },
                C: { value: 3, done: async () =>  {await delay(10);return "C"}, next: ["A"] }
            }
        }) 
        //jest.useFakeTimers()
        await fsm.waitForState("A")    
        expect(fsm.current.name).toBe("A")
        let count = 100
        // A->B->C->A
        for(let i =1; i<=count;i++){
            await fsm.transition("B")
            expect(fsm.current.name).toBe("B")
            await fsm.transition("C")
            expect(fsm.current.name).toBe("C")
            await fsm.transition("A")
            expect(fsm.current.name).toBe("A")
        }

        new Array(count).fill(0).forEach(()=>expectEvents.push(...["A","B","C"]))
        expectEvents.push("A")
        expect(actualEvents).toStrictEqual(expectEvents)
    })
    test("切换到Final状态后,再次转换会出错，重置后又可以转换",async () => {
        const actualEvents = [] // A,B,A,B,A,A,B
        const expectEvents = [ ]
        const fsm  = new FlexStateMachine({
            states:{
                A: { value: 1, initial: true, next: ["B"] },
                B: { value: 2, final:true, next: "C" },
                C: { value: 3, next: ["A"] }
            },
            context: {
                onTransition:({event,from,to})=>{
                  if(event==="END")   actualEvents.push(to)
                }
            }
        }) 

        let count = 10
        for(let i = 0; i < count; i++) {
            await fsm.waitForState("A")    
            expect(fsm.current.name).toBe("A")
            await fsm.transition("B")
            expect(fsm.current.name).toBe("B")            
            try{
                await fsm.transition("C") // B状态已经是最终状态，所以要转换到C会导致出错
            }catch(e){
                expect(e).toBeInstanceOf(FinalStateError)
                expect(fsm.CURRENT).toBe(fsm.B) // 最终状态是B
            }            
            await fsm.reset()// 重置状态机，马上运行状态机
        }
        expect(fsm.CURRENT).toBe(fsm.A)
        new Array(count).fill(0).forEach(()=>expectEvents.push(...["A","B"]))
        expectEvents.push("A")
        expect(actualEvents).toStrictEqual(expectEvents)        
    })

    test("断开重连机制",async () => {
        const count = 100 
        const actualEvents = []
        const expectEvents = [
            "Initial/enter","Initial/done",
            "Initial/leave","Connecting/enter","Connecting/done","Connecting/leave","Connected/enter","Connected/done","Connected/leave","Disconnected/enter","Disconnected/done","---"
        ] 
        new Array(count-1).fill(0).forEach(()=>expectEvents.push(...[
            "Disconnected/leave","Connecting/enter","Connecting/done","Connecting/leave","Connected/enter","Connected/done","Connected/leave","Disconnected/enter","Disconnected/done","---"
        ]))
        const fsm = new TcpClientStateMachine({
            autoStart:false,
            actions:{ 
                connect:{ 
                    when:["Initial","Disconnected","Error"],
                    pending:"Connecting",
                    execute: async function (){
                        await delay(10)
                    },
                    resolved:"Connected"
                },
                disconnect:{ 
                    when:["Connected"],
                    pending:"Disconnecting",
                    execute: async function (){
                        await delay(1)
                    },
                    resolved:"Disconnected"
                }
            }
        })    
        
        fsm.on("*/leave",({from,to})=>actualEvents.push(`${from}/leave`)) 
        fsm.on("*/enter", ({from,to}) => actualEvents.push(`${to}/enter`))                
        fsm.on("*/done",({params,from,to})=>{
            actualEvents.push(`${to}/done`)
            if(to==="Disconnected") {
                actualEvents.push("---")
                if(params<count){
                    fsm.connect().catch(e=>{})  // 当断开时自动重新执行连接动作
                }                
            }
        })         
        await fsm.start()        
        await fsm.connect() 
        for(let i =1; i<=count;i++){
            await fsm.waitForState("Connected")
            await fsm.transition("Disconnected",i)  // 模拟服务器断开
        }
        expect(actualEvents).toStrictEqual(expectEvents)
     
    },50000)   

    test("连接出错时自动重连",(done) => {
        let count = 10,  reConnectCount = 0
        const actualEvents = []
        const expectEvents = [
            "Initial/enter","Initial/done",
            "Initial/leave","Connecting/enter","Connecting/done","Connecting/leave","Disconnected/enter","Disconnected/done","---"
        ] 
        new Array(count).fill(0).forEach(()=>expectEvents.push(...[
            "Disconnected/leave","Connecting/enter","Connecting/done","Connecting/leave","Disconnected/enter","Disconnected/done","---"
        ]))
        let executeCount = 0
        const fsm = new TcpClientStateMachine({
            autoStart:false,
            actions:{ 
                connect:{ 
                    when:["Initial","Disconnected","Error"],
                    pending:"Connecting",
                    retryCount:3,    
                    retryInterval:0,                   
                    execute: async function (){
                        executeCount++
                        throw new Error("CONNECT_ERROR")
                    },
                    resolved:"Connected",
                    rejected:"Disconnected"
                }
            }
        })    
        
        fsm.on("*/leave",({from,to})=>actualEvents.push(`${from}/leave`)) 
        fsm.on("*/enter", ({from,to}) => actualEvents.push(`${to}/enter`))                
        fsm.on("*/done",({params,from,to})=>{
            actualEvents.push(`${to}/done`)
            if(to==="Disconnected") {
                actualEvents.push("---")
                if(reConnectCount< count){
                    reConnectCount++
                    fsm.connect()               
                }else{
                    expect(fsm.current.name).toBe("Disconnected")
                    // 第一次执行时会重试3次，然后重试10次connect，每次重试执行3次，共33次
                    expect(executeCount).toEqual(3+count*3)        
                    expect(expectEvents).toStrictEqual(actualEvents)
                    done()
                }                
            }
        })         
        fsm.start().then(async ()=>{
            fsm.connect()
        })
         
    },500000)
    


    test("转换到初始状态失败后回退到ERROR状态",async ()=>{
        const actualEvents = [] // A,B,C,A,B,C,.....
        const expectEvents = [ ]
        const fsm  = new FlexStateMachine({
            states:{
                A: { value: 1, initial: true, 
                    leave: async () => {
                        throw new Error()
                    }, next: ["B"] },
                B: { value: 2 },
                C: { value: 3}
            }
        }) 
        await fsm.waitForInitial()
    
    })


})

describe("执行动作",()=>{   

    test("执行连接动作",async ()=>{
        const actualEvents = []  
        const expectEvents = [  
            "Initial",
            "Connecting","Connected",               // 第一次连接时
            "Initial",                              // 重置
            "Connecting","Disconnected"             // 第二次连接时
        ]
        const tcp = new TcpClientStateMachine({ 
            throwActionError:true,
            onTransitionEnd:({from,to}) => {
                actualEvents.push(to)
            },
            actions:{
                connect:{
                    when    : ["Initial"],
                    pending : "Connecting",
                    resolved: "Connected",
                    rejected: "Disconnected",
                    execute : async function({host,port}={}) { 
                        if(host===""){
                            throw new Error()
                        }else{
                            return 1
                        }
                    }
                }
            }        
        })
        await tcp.waitForInitial()
        // 第一次 : 连接成功
        let result = await tcp.connect({host:"192.168.1.1",port:7511})
        expect(tcp.current.name).toBe("Connected")
        expect(result).toBe(1)
        // 重载操作将使状态机重新回到Initial
        await tcp.reset()
        // 第二次: 连接失败
        try{
            await tcp.connect({host:"",port:7511})
        }catch(e){
            expect(e).toBeInstanceOf(Error)
            expect(tcp.current.name).toBe("Disconnected")
        }
    })

    test("执行连接动作失败回退到原始状态",async ()=>{
        const actualEvents = []  
        const expectEvents = [  
            "Initial",
            "Connecting",              
            "Initial"
        ]
        const tcp = new TcpClientStateMachine({ 
            throwActionError:true,
            onTransitionEnd:({from,to}) => {
                actualEvents.push(to)
            },
            actions:{
                connect:{
                    when    : ["Initial"],
                    pending : "Connecting",
                    execute : async function({host,port}={}) { 
                        if(host===""){
                            throw new Error()
                        }else{
                            return 1
                        }
                    }
                }
            }        
        })
        await tcp.waitForInitial()
        // 第一次 : 连接失败
        try{
            await tcp.connect({host:"",port:7511})
        }catch(e){
            expect(e).toBeInstanceOf(Error)
            expect(tcp.current.name).toBe("Initial")
        }
    }) 
    test("执行连接动作的参数均采用函数",async ()=>{
        const actualEvents = []  
        const expectEvents = [  
            "Initial",
            "Connecting","Connected",               // 第一次连接时
            "Initial",                              // 重置
            "Connecting","Disconnected"             // 第二次连接时
        ]
        const tcp = new TcpClientStateMachine({ 
            throwActionError:true,
            onTransitionEnd:({from,to}) => {
                actualEvents.push(to)
            },
            actions:{
                connect:{
                    when    : ["Initial"],
                    pending : ()=>"Connecting",
                    resolved: (result)=>{
                        expect(result).toBe(1)
                        return "Connected"
                    },
                    rejected: (e)=>{
                        expect(e).toBeInstanceOf(Error)
                        return "Disconnected"
                    },
                    execute : async function({host,port}={}) { 
                        if(host===""){
                            throw new Error()
                        }else{
                            return 1
                        }
                    }
                }
            }        
        })
        await tcp.waitForInitial()
        // 第一次 : 连接成功
        let result = await tcp.connect({host:"192.168.1.1",port:7511})
        expect(tcp.current.name).toBe("Connected")
        expect(result).toBe(1)
        // 重载操作将使状态机重新回到Initial
        await tcp.reset()
        // 第二次: 连接失败
        try{
            await tcp.connect({host:"",port:7511})
        }catch(e){
            expect(e).toBeInstanceOf(Error)
            expect(tcp.current.name).toBe("Disconnected")
        }
    })
    test("执行连接动作的When参数不匹配时产生错误",async ()=>{
        const actualEvents = []  
        const expectEvents = ["Initial"]
        const tcp = new TcpClientStateMachine({ 
            throwActionError:true,
            onTransitionEnd:({from,to}) => {
                actualEvents.push(to)
            },
            actions:{
                connect:{
                    when    : ["Connecting"],  // Connecting.next不包括Connecting
                    pending:"Connecting",
                    execute : async function({host,port}={}) { 
                        if(host===""){
                            throw new Error()
                        }else{
                            return 1
                        }
                    },
                    resolved:"Connected"
                }
            }        
        })
        await tcp.waitForInitial()
        try{
            await tcp.connect({host:"",port:7511})
        }catch(e){
            expect(e).toBeInstanceOf(Error)
            expect(tcp.current.name).toBe("Initial")
            expect(actualEvents).toStrictEqual(expectEvents)
        }
    })

    test("通过装饰器声明动作",async ()=>{
        const actualEvents = []  
        const expectEvents = [  
            "Initial",
            "Connecting","Connected",               // 第一次连接时
            "Initial",                              // 重置
            "Connecting","Disconnected"             // 第二次连接时
        ]
        class MyTcp extends TcpClientStateMachine{
            @state({
                when    : ["Initial"],
                pending : "Connecting",
                resolved: "Connected",
                rejected: "Disconnected",
            })
            connect({host,port}={}) { 
                if(host===""){
                    throw new Error()
                }else{
                    return 1
                }
            }
            onTransitionEnd({from,to}){
                actualEvents.push(to)
            }
        }
        const tcp = new MyTcp({throwActionError:true})
        await tcp.waitForInitial()
        // 第一次 : 连接成功
        let result = await tcp.connect({host:"192.168.1.1",port:7511})
        expect(tcp.current.name).toBe("Connected")
        expect(result).toBe(1)
        // 重载操作将使状态机重新回到Initial
        await tcp.reset()
        // 第二次: 连接失败
        try{
            await tcp.connect({host:"",port:7511})
        }catch(e){
            expect(e).toBeInstanceOf(Error)
            expect(tcp.current.name).toBe("Disconnected")
        }
    })


    test("通过装饰器声明动作执行超时失败后重试",async ()=>{
        let retryCount = 0 
        const actualEvents = []  
        const expectEvents = [  
            "Initial",                              // 重置
            "Connecting","Disconnected"             // 第二次连接时
        ]
        // 动作执行阶段会触发事件：
        // emit("actions/connect/pending")
        // emit("actions/connect/resolved")
        // emit("actions/connect/rejected")
        // emit("actions/connect/finally")
        class MyTcp extends TcpClientStateMachine{
            @state({
                when         : ["Initial"],
                pending      : "Connecting",
                rejected     : "Disconnected",
                timeout      : 5,
                retryCount   : 3,
                retryInterval: 1
            })
            async connect({host,port}={}) { 
                retryCount++
                await delay(10) 
            }
            onTransitionEnd({from,to}){
                actualEvents.push(to)
            }
        }
        const tcp = new MyTcp({
            throwActionError:true
        })
        await tcp.waitForInitial() 
        try{
            await tcp.connect({host:"",port:7511})
        }catch(e){
            expect(retryCount).toBe(3)
            expect(e).toBeInstanceOf(Error)
            expect(tcp.current.name).toBe("Disconnected")
        }
    })

})


describe("子状态",()=>{    
    
    test("转换到Connected子状态",async ()=>{ 
        const actualEvents = []
        const expectEvents = [
            "Initial","Connecting","Connected",
            "Connected/Authorizating","Connected/Authorizated","Connected/CancelAuthorizating","Connected/UnAuthorizated",
            "Disconnecting","Disconnected"
        ]  
        const fsm = new TcpClientStateMachine({
            autoStart:false,
            actions:{
                connect:{
                    pending:"Connecting",
                    execute:async () =>  {},
                    resolved:"Connected"
                },
                disconnect:{
                    pending:"Disconnecting",
                    execute:async () =>  {},
                    resolved:"Disconnected"
                }
            },
            onTransitionEnd:({from,to})=>actualEvents.push(to)
        })    

        // 创建子状态
        
        let ConnectedFSM = fsm.states.Connected.createScope({
            states:{
                Authorizating:{value:1,initial: true,next:["Authorizated"]},   // 正在授权
                Authorizated:{value:2},                  // 已授权
                CancelAuthorizating:{value:3},            // 正在取消授权
                UnAuthorizated:{value:4}                // 未授权
            },
            onTransitionEnd:({from,to})=>actualEvents.push(`Connected/${to}`)
        })         
        const startFn = jest.fn(),stopFn = jest.fn()
        ConnectedFSM.on("start",startFn)
        ConnectedFSM.on("stop",stopFn)
        await fsm.start()
        await fsm.connect()                         // 连接成功后进入Connected
        await ConnectedFSM.waitForInitial()
        await ConnectedFSM.transition("Authorizated")
        await ConnectedFSM.transition("CancelAuthorizating")
        await ConnectedFSM.transition("UnAuthorizated")
        fsm.disconnect() // 断开将导至子状态机停止
        await fsm.waitForState("Disconnected")
        expect(ConnectedFSM.running).toBeFalsy()
        expect(actualEvents).toStrictEqual(expectEvents)
        expect(startFn).toHaveBeenCalled()
        expect(stopFn).toHaveBeenCalled()
        try{
            await ConnectedFSM.transition("Authorizated")// 因为子状态机已经停止，所以会出现
        }catch(e){
            expect(e).toBeInstanceOf(Error)
        }        
    })   
})



describe("错误处理", () => {
    test("离开A状态出错后,重试3后出错",async () => {
        const actualEvents = []  
        const expectEvents = []
        let retryCountOfleaveB = 0 
        class CustomError extends Error {}
        const fsm = new FlexStateMachine({
            states:{
                A: { 
                    value: 1, 
                    initial: true,
                    leave:({retry,retryCount})=>{
                        retryCountOfleaveB++
                        try{
                            throw new Error()
                        }catch(e){
                            if(retryCount<3){
                                retry()
                            }else{
                                throw new CustomError("LeaveBError")
                            }
                        }                                             
                    }
                },
                B:{
                    value:2,
                    enter:()=>{throw new Error()}
                },
                C:{value:3}
            },
            onTransitionEnd:({from,to}) => {
                endStates.push(to)
            }        
        })        
        await fsm.waitForInitial()  
        try{
            await fsm.transition("B")
        }catch(e){
            expect(e.message).toBe("LeaveBError")
            expect(retryCountOfleaveB).toBe(4)
        }
    })
    test("离开A状态进入B状态时出错,重试3后出错",async () => {
        const actualEvents = []  
        const expectEvents = []
        let aEnterRetryCount = 0,resumeCount = 0
        class CustomError extends Error {}
        const fsm = new FlexStateMachine({
            states:{
                A: { 
                    value: 1, 
                    initial: true,
                    leave:({retry,retryCount})=>{

                    },
                    // 
                    resume:({from,to,error})=>{
                        expect(error.message).toBe("aEnterError")
                        if(resumeCount>0){
                            throw new Error("RESUME_ERROR")
                        }
                        resumeCount++
                    }
                },
                B:{
                    value:2,
                    enter:({retry,retryCount})=>{
                        aEnterRetryCount++
                        try{
                            throw new Error()
                        }catch(e){
                            if(retryCount<3){
                                retry()
                            }else{
                                throw new CustomError("aEnterError")
                            }
                        }
                    }
                },
                C:{value:3}
            },
            onTransitionEnd:({from,to}) => {
                endStates.push(to)
            }        
        })        
        const errorCallback = jest.fn()
        // 转换到错误状态的回调
        fsm.on("ERROR/done", errorCallback)
        await fsm.waitForInitial()  
        // 第一次转换失败：resume成功，所以保持在A状态
        try{
            await fsm.transition("B")
        }catch(e){
            expect(e.message).toBe("aEnterError")
            expect(fsm.current.name).toBe("A")
            expect(aEnterRetryCount).toBe(4)
        }
        // 第二次转换失败：resume出错, 所以转换到ERROR状态
        try{
            await fsm.transition("B")
        }catch(e){
            expect(e.message).toBe("aEnterError")
            expect(fsm.current.name).toBe("ERROR")  
            expect(aEnterRetryCount).toBe(8)
            expect(errorCallback).toHaveBeenCalled()
        }
    })

})
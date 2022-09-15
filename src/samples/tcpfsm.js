
import FlexStateMachine from "../index.js"
import {  } from "../index.js"
import { delay } from "../utils.js"


class TCPClient extends FlexStateMachine{
    @state({pending,timeout,resolved,rejected}) 
    async connect(){

    }
}

const fsm = new FlexStateMachine({ 
    initialState : "Initial",
    states:{
        Initial:{
            value:0,
            enter:async function(params){
                await delay()
                console.log("Enter <Initial> state \t\t",JSON.stringify(params))
            },
            leave:async (params)=>{
                await delay()
                console.log("Leave <Initial> state \t\t",JSON.stringify(params))
            },
            next:["Connecting","Disconnected"]
        },
        Connecting:{
            value:1,
            enter:async ({params})=>{
                await delay()
                console.log("Enter <Connecting> state \t",JSON.stringify(params))
                //throw new Error("sfddd")
            },
            leave:async (params)=>{
                await delay()
                console.log("Leave <Connecting> state \t",JSON.stringify(params))
            },
            next:["Connected","Disconnected"]
        },
        Connected:{
            value:2,
            enter:async (params)=>{
                await delay()
                console.log("Enter <Connected> state  \t",JSON.stringify(params))
                console.log("连接成功")
            },
            leave:async (params)=>{
                await delay()
                console.log("Leave <Connected> state  \t",JSON.stringify(params))
            },
        },
        Disconnecting:{
            value:3,
            enter:async (params)=>{                
                console.log("Enter <Disconnecting> state \t" ,JSON.stringify(params))
                console.log("正在断开连接...")
                await delay()
            },
            leave:async (params)=>{
                console.log("Leave <Disconnecting> state \t",JSON.stringify(params))
                await delay()                
            },
        },
        Disconnected:{
            value:4,
            enter:async (params)=>{
                await delay()
                console.log("Enter <Disconnected> state \t",JSON.stringify(params)) 
            },
            leave:async (params)=>{
                await delay()
                console.log("Leave <Disconnected> state \t",JSON.stringify(params))
                
            },
        }
    },
    actions:{
        //
        connect:{  
            // 当开始执行时，进入<连接中>状态
            pending:"Connecting", 
            execute:async (params)=>{
                await delay(1000);                
            },  
            // 如果超时则resolved
            timeout:500,                  
            //
            resolved:"Connected",
            rejected:"Disconnected",
            // 
        },
        // 
        disconnect:{
            pending:"Disconnecting",
            execute:async (params)=>{                
                await delay(1000)
            },
            timeout:1000,               // 可选的超时     
            // 断开的标志是以on("close")事件为准，但是问题是有可能无法接收到该事件
            finally:"Disconnected"
        }
   }
})

export default fsm
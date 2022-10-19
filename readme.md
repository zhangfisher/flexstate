# FlexState


有限状态机是一种用来进行对象行为建模的工具，其作用主要是描述对象在它的生命周期内所经历的状态序列，以及如何响应来自外界的各种事件。
比较典型的是`TCP Socket`协议客户端，其生命周期内存在明显的状态转换。在软件开发中，有大量的行为均可以通过有限状态机来进行管理，自己实现一个有限状态机并不难，当前也有现成的有限状态机的实现,在试用了几个后(如`xstate`,`Javascript State Machine`等)，效果并不尽不人意。
- `xstate`太强大了，也太复杂了，学习成本高，我只是要一个简单的状态机而已。
- `Javascript State Machine`在进行异步切换时存在问题。

因此，就自己实现了`FlexState`。`FlexState`是一款有限状态机，具有以下特性：

1. 基于`Class`构建有限状态机实例
2. 支持定义状态的`enter`和`leave`异步事件
3. 状态切换完全支持异步操作
4. 支持定义异步Action
5. 支持生命周期事件订阅
6. 支持错误处理和状态切换中止


# 快速入门

```javascript
   const TcpClient = new FlexState({        
       name        : "tcpclient", // 名称        
       initialState: "Initial",   // 初始状态
       immediate   : false,       // 初始化后立即触发事件，即立即触发initialState
       timeout     : 1000,        // 状态回调超时时间，0-表示不进行超时控制
       context     : {},          // 全局上下文字典       
       states      : {            // 定义状态
            Initial:{
                value:0,
                title:"空闲",
                to:["Connecting"]
            },
            Connecting:{
                value:1,
                title:"正在连接",   
                next:["Connected","Disconnected"],         
                enter:async (params)=>{}, 
                leave:async (params)=>{}
            },
            Connected:{
                value:2,
                next:["Disconnecting","Disconnected"],
                enter:async (params)=>{}, 
                leave:async (params)=>{}
            },
            Disconnecting:{
                value:3,
                next:["Disconnected"],
                enter:async (params)=>{}, 
                leave:async (params)=>{}
            },
            Disconnected:{
                value:4,
                next:["Connecting","Initial"]
            } 
       },
       // 动作 --> 动作执行会引起状态切换 
       actions:{
            connect:{
                pending:"Connecting", 
                // 执行一个或者多个动作,比如连接
                execute:async ()=>{
                    return new Promise((resolve,reject)=>{
                        
                    })                    
                },  
                // 如果超时则resolved
                timeout:1000,                  
                resolved:result=>"connected",               // 执行成功时，进入<已连接>状态                  
                rejected:"disconnected"                     // 执行失败时，进入断开状态
            },
            // 
            disconnect:{
                pending:"disconnecting",
                execute:async ()=>{
                     
                }，
                timeout:1000,                
                finally:(result)=>{
                    return "disconnected"
                }
            }
       }
        
  })
```
    TcpClientSm.state == 当前状态

    // 执行Action
    TcpClientSm.connect()     
    依次发生事件  
    TcpClientSm.on("initial/leave",)              离开初始状态   
    TcpClientSm.on("connecting/enter")            进入连接中状态
    TcpClientSm.on("connecting/leave")
       |
       |_____TcpClientSm.on("Connected/enter",)      成功：
       |   
       |_____TcpClientSm.on("disconnected/enter",)         失败：          
   
    触发事件
      TcpClientSm.emit("connect") == TcpClientSm.connect()  
      TcpClientSm.emit("close") == TcpClientSm.disconnect()  

    
    socket

    socket.on("connect",TcpClientSm.connect)
    socket.on("error",)
    socket.on("close",)
    socket.on("end",)
    


# API


# 更新历史

# 状态机
## 转换流程

整体转换流程如下：

![](../images/states.jpg)

- 创建状态机时，状态机处于`IDLE`状态，这是一个特殊状态，此时状态机还没有开始启动。
- 接下来调用状态机的`start`方法来启动状态机的运行。状态机运行后，首先就会转换至`initial=true`的状态。
- 接下来状态机将受`动作`和`事件`驱动进行各种业务状态之间的转换，并在状态转换期间**触发各事件和钩子**。
- 可以指定一个`error=true`的状态作为约定的错误状态，当执行动作或钩子处理出错时，将指定或自动转换至此状态；`ERROR`状态并不是一个`Final`状态，这取决于对错误的处理方式。
- 当状态机转换到`Final`状态或者调用`stop`方法后就代表了整个状态机已结束，不能再从`Final`状态转换至任何一个状态。但是可以通过调用`reset`方法重置整个状态机。

## 创建状态机

使用状态机可以有三种方式：

- 继承状态机类
- 直接实例化状态机
- 直接实例化状态机并指定上下文

### 继承状态机类

`FlexStateMachine`是一个类，可以直接继承该类来构建自己的状态机。

- 在类静态变量`states`声明有限状态
- 在类静态变量`actions`声明动作
- 通过`@state`装饰器声明动作
- 通过`on<State>Enter`、`on<State>`、`on<State>Leave`声明状态转换钩子
- 通过`onTransition<Begin|End|Cancel>`侦听状态转换事件

```typescript
import { state, FlexStateMachine } from "flexstate"

class MyStateMachine extends FlexStateMachine{
    // 声明状态
    static states = {
      "[状态名称]":{......},
      "[状态名称]":{......},                
      ....
    }					
    static actions = {
      "[动作名称]":{......},
      "[动作名称]":{......},                
      ....
    }
      
    // 声明动作
    @state({ })
    onAction1(params){ }
    @state({ })
    onAction2(params){ }
  
    // 状态转换钩子：
    onState1Enter({from,to}){...}						// 进入状态前
    onState1({from,to}){...}							  // 已转换到指定状态
    onState1Leave({from,to}){...}						// 离开状态前
    
    onState2Enter({from,to}){...}						// 进入状态前
    onState2({from,to}){...}								// 已转换到指定状态
    onState2Leave({from,to}){...}						// 离开状态前
    
    // 状态转换监视
    onTransitionBegin({from,to}){ }			        // 当开始转换状态时
    onTransitionEnd({from,to}){ }       	            // 转换状态结束时
    onTransitionCancel({from,to}){ }			        // 转换状态被中止
    onTransition({event,from,to}){ }                 // 转换状态，包括以上所有事件
}

```
### 直接实例化状态机

通过继承`FlexStateMachine`类来引入状态机会更加简洁。但是由于Javascript无法支持多继承，因此在某此情况下可以通过直接创建`FlexStateMachine`实例的方式来引入状态机。通过直接创建`FlexStateMachine`的方式来实例化一个状态机。

```typescript
const fsm = new FlexStateMachine({ 
    context:<状态机上下文对象>,  
    // 定义所有状态
    states:{
        Initial:{          
          enter:()=>{...},
          leave:()=>{...},
          done:()=>{...}
          ...
        },
        Connecting:{...},
        Connected:{...},
        Disconnecting:{...},
        Disconnected:{...}
        .....
    },
    // 定义状态机动作 
    actions:{
        connect:{
          when:["Initial","Disconnected","Error"],   // 代表只能当处于此三种状态时才允许调用连接方法    
          pending:"Connecting",											 // 执行后进入正在连接中的状态
          execute:()=>{ }												 // 动作执行函数
        },
        disconnect:{
           when:["Connected"],     							// 代表只有在已连接状态才允许执行断开方法
           pending:"Disconnecting"						  // 执行后进入正在断开连接中的状态
           execute:()=>{ }										// 动作执行函数
        },
        ......
    },
    onTransitionBegin({event,from,to,error,params}){ }			// 当开始转换状态时
    onTransitionEnd({event,from,to,error,params}){ }       	// 转换状态结束时
    onTransitionCancel({event,from,to,error,params}){ }			// 转换状态被中止
    onTransition({event,from,to,error,params}){ }     // 转换状态，包括以上所有事件
    // 其他状态机参数
   ....
})
```


### 直接实例化状态机并指定上下文

直接实例化状态机有个问题，需要指定`声明状态/动作/钩子事件`，这样就会导致一个问题，负责具备业务逻辑的类与状态机之间的分离的，导致开发上的不方便，因此`flexstate`支持在`new FlexStateMachine({}) `时可以通过指定`context`来为状态机指定上下文,然后就可以在上下文类中声明`states`、`actions`以及`钩子事件`等。

```typescript

class MyClass extends otherClass {
    static states:FlexStateMap = {}
    static actions:FlexStateActionMap = {}
    #fsm:FlexStateMachine
    constructor(){        
        this.#fsm=new FlexStateMachine({
            context:this                // 指定当前实例作为状态机的上下文y
        })
    }
    // 声明动作
    @state({ })
    onAction1(params){ }
    @state({ })
    onAction2(params){ }
  
    // 状态转换钩子：
    onState1Enter({from,to}){...}						// 进入状态前
    onState1({from,to}){...}							  // 已转换到指定状态
    onState1Leave({from,to}){...}						// 离开状态前
    
    onState2Enter({from,to}){...}						// 进入状态前
    onState2({from,to}){...}								// 已转换到指定状态
    onState2Leave({from,to}){...}						// 离开状态前
    
    // 状态转换监视
    onTransitionBegin({from,to}){ }			// 当开始转换状态时
    onTransitionEnd({from,to}){ }       	// 转换状态结束时
    onTransitionCancel({from,to}){ }			// 转换状态被中止
    onTransition({event,from,to}){ }     // 转换状态，包括以上所有事件
}


```

## 状态机上下文

通过直接实例化状态机来使用状态机有个问题，就是状态转换钩子函数、状态转换事件等的`this`指向问题。在上例中，如果要`Connected`状态下做些什么，则需要这样做。

```typescript
class TcpClient{         
  constructor(options={}){
     this._fsm = new   FlexStateMachine({
        states:{
           Connected:{
              done:this.onConnected.bind(this)
           },
           ......
        },
        actions:{
           connect:{
             execute:this.connect.bind(this)
           },
           ......
        },
        onTransitionBegin({from,to}){ }			// 当开始转换状态时
        onTransitionEnd({from,to}){ }       	// 转换状态结束时
        onTransitionCancel({from,to}){ }			// 转换状态被中止
        onTransition({event,from,to}){ }     // 转换状态，包括以上所有事件
      
     }
  }
  onConnected(){
      //... 连接后做点什么   
  }
  async connect(){
    return await this._fsm.connect(...)
  }			// 连接方法会导致状态
}
```
上例中需要自行为状态钩子指定正确的`this`参数。这种操作方式与业务类结合比较松散。此时可以通过指定`context`参数来简化。简化后如下：
```typescript
class TcpClient extends xxxx{   
  static states={
    Connected:{ }           
    ....
  }
  constructor(options={}){
     this._fsm = new   FlexStateMachine({
         context:this,				// 重点!!! 
       
     }
  }
  onConnected(){
      //... 连接后做点什么   
  }
  onTransitionBegin({from,to}){ }			// 当开始转换状态时
  onTransitionEnd({from,to}){ }       	// 转换状态结束时
  onTransitionCancel({from,to}){ }			// 转换状态被中止
  onTransition({event,from,to}){ }     // 转换状态，包括以上所有事件
  @state(...)
  connect(){.....}
}

```
当我们为状态机指定了`context`参数时，状态机将从`context`上读取声明的`static states`、`static actions`、以及`@state`声明的动作，同时所有的状态转换钩子、转换事件侦听器均可以直接声明在`context`上，一切就好象继承了`FlexStateMachine`类一样。快速入门中的例子，可以改写如下：

```typescript
import {state, FlexStateMachine } from "flexstate"

class TcpClient extends XXXX{         
  static states = {
    //
  }
  constructor(options={}){
     this._fsm = new FlexStateMachine({ 
         context : this,                                    // 重点!重点!重点!  
     }) 
  }  
  // 其动作或钩子均可以定义在此

}
```

## 启动状态机

状态机实例化后处于一个默认的`IDLE`状态，然后会自动启动，即转换到`initial=true`的状态。

- 如果所有状态均没有一个`initial=true`的状态，则自动取第一个状态为初始状态，总之状态机有且只有一个`initial=true`的状态。
- 状态机将触发`start`事件，可以通过`fsm.on("start",callback)`来订阅状态机启动事件。
- 如果不希望在实例铧时自动启动状态机，则可以配置`autoStart=false`，然后就需要自行调用`start`方法来启动状态机。

```typescript
// 默认行为：自动启动状态机
let fsm = new FlexStateMachine({
  states:["Initial","Connecting","Connected"],
})
// 关闭自动启动状态机
let fsm = new FlexStateMachine({
    autoStart:false,			
    states:["Initial","Connecting","Connected"]
}
fsm.start()
```

## 停止状态机

当调用状态机的`stop`方法后，状态机将停止运行，此时不用再执行动作和转换状态。调用`stop`方法将：

- 中止正在进行的转换状态回调
- 中止正在执行的动作
- 状态机将被重置到`IDLE`状态
- 状态机将触发`stop`事件，可以通过`fsm.on("stop",callback)`来订阅状态机停止事件。
- 状态机停止后可以通过`start`再次启动。

## 运行状态

状态机本身具有以下状态：

- **IDLE：**实例化但还没有调用`start`方法前的状态
- **RUNNING：**状态机调用`start`方法后会自动转换到`Initial`状态，此时状态机处于任何一个非`FINAL`状态。
- **FINAL：**当状态机转换至任一个`FINAL`状态时。此时只能通过`reset`来重置状态机。
- **ERROR：**错误状态，当状态机因为出错时

## 状态机参数

创建状态机的构造参数如下：

```typescript
const fsm = new FlexStateMachine({
  name              : "",                                         // 当前状态机名称
  parent            : null,                                       // 父状态
  context           : null,                                       // 当执行动作或状态转换事件时的this指向
  autoStart         : true,                                       // 是否自动开始运行状态机，=false需要调用.start()
  states            : {},                                         // 状态声明
  actions           : {},                                         // 动作声明
  injectActionMethod: true,                                       // 将动作方法注入到当前实例中
  injectStateValue  : true,                                       // 在实例中注入：大写状态名称的字段，其值 =状态值
  history           : 0,                                          // 记录状态转换历史，0=不记录，N=最大记录N条历史
  // 状态机转换监控回调
  onTransitionBegin:async ({event,from,to}){ }, 
  onTransitionEnd:async ({event,timeConsuming,from,to}){ },
  onTransitionCancel:async ({event,from,to}){ }, 
  onTransitionError:async ({event,error,from,to}){ },
  onTransition:async ({event,timeConsuming,error,from,to}){ },
})
```

## 状态机事件

`FlexStateMachine`类继承自`flex-decorators/liteEventemitter`，本身就是一个`EventEmitter`。状态机将在工作期间触发以下事件：

- **状态机启动事件：**`start`
- **状态机停止事件：**`stop`
- **切换FINAL状态事件：**`final`
- **转换钩子事件：**`<state>/enter`、`<state>/leave`、`<state>/done`、`<state>/resume`
- **转换生命周期事件：**`transition/begin`、`transition/cancel`、`transition/error`、`transition/end`

可以访问[flex-decorators/liteEventemitter](https://zhangfisher.github.io/flex-decorators/)查询其API

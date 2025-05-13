# 拦截状态

`flexstate`支持定义状态转换钩子(`Hook`)，允许对转换过程进行拦截。

## 支持的钩子类型

状态转换钩子指的是在状态转换其间调用的函数，支持以下类型的拦截钩子。

- `enter`：当准备进入某个状态时调用，可以通过`返回false`和`触发错误`来阻止状态转换。
- `leave`：当准备离开某个状态时调用，可以通过`返回false`和`触发错误`来阻止状态转换。
- `done`：当已转换到某个状态时调用，该钩子不处理错误，不能通过`返回false`和`触发错误`来阻止状态转换。
- `resume`：当执行`enter`钩子出错时，会调用上一个状态的`resume`来尝试恢复和消除`leave`产生的副作用。

## 实现原理

状态转换钩子是在调用`transition`方法转换状态时被调用的函数。`transition`方法并不是直接调用这些定义的钩子函数的，而是通过`emitAsync`来触发事件转换事件，然后钩子函数订阅事件。假设当前状态是`A`，当调用`transition("B")`方法时将发生：

- 先调用`canTransition("A","B")`方法来判断能否从`A`转换到`B状态`，如果`canTransition`返回`false`，则代表不允许从`A`转换到`B状态`，将触发`TransitionError`错误。
- 接下来会触发`emitAsync("A/leave")`事件，代表将离开`A状态`。所有`leave`钩子函数本质上均是订阅了`A/leave`事件，并且钩子函数可以通过返回`false`和`触发错误`来阻止离开`A`状态。`emitAsync`实质上是通过`Promise.all`调用所有钩子函数的。
- 如果所有订阅了`A/leave`事件的钩子函数均没有阻止离开`A状态`。接下来，应会触发`emitAsync("B/enter")`事件，所有`leave`钩子函数同样是订阅了`B/enter`事件，可以在进入`B状态`前做一些事件，也可以通过返回`false`和`触发错误`来阻止进入`B状态`。
- 如果成功进入`B状态`，则会`emitAsync("B/done")`事件。如果`B/enter`返回`false`或者`触发错误`而导致无法进入`B状态`，而会触发`emitAsync("A/resume")`

可以看出，状态机会在转换过程中，视情况触发`<State>/leave`、`<State>/enter`、`<State>/resume`、`<State>/done`等事件。因此，开发者可以通过`fsm.on(<State>/leave,callback)`、`fsm.on(<State>/enter,callback)`、`fsm.on(<State>/resume,callback)`、`fsm.on(<State>/done,callback)`来订阅转换钩子。

## 定义钩子

可以通过以下方法来声明拦截钩子，拦截钩子可以是同步函数，也可以是异步函数。

钩子函数签名如下：

```typescript
export interface FlexStateTransitionEventArguments{
    event? : 'CANCEL' | 'BEGIN' | 'END' | 'ERROR'
    from  : string
    to    : string
    error?: Error
    params?:any
    [key: string]:any
}

// 钩子参数 {from,to,error,params,retry,retryCount}
export type FlexStateTransitionHookArguments = Exclude<FlexStateTransitionEventArguments,'event'> & {
    retryCount    : number                                                  // 重试次数,
    retry         : Function | ((interval?:number)=>void)                   // 马上执行重试
}
type FlexStateTransitionHook = ((args:FlexStateTransitionHookArguments)=>Awaited<Promise<any>> | void ) | undefined  
type FlexStateTransitionHookExt = FlexStateTransitionHook | [FlexStateTransitionHook,{timeout:number}]
```



**定义钩子函数有以下几种方法：**

### **构造时传入**

```typescript
new FlexStateMachine({ 
    states:{
        Initial:{           
            enter:async function({from,to,error,params,retry,retryCount}){},
            leave:async ({from,to,error,params,retry,retryCount})=>{},
            done:async ({from,to,error,params})=>{},
            resume:async ({from,to,error,params,retry,retryCount})=>{},
        },
    }
    //...    
}
```

###  **定义类方法进行侦听**

在`类`或`context`中直接定义`on<State>Enter`/`on<State>Levae`/`on<State>Done`/`on<State>`/`on<State>Resume`实例方法，如:  

```typescript

class MyStateMachine extends FlexStateMachine{
    async onInitialEnter({from,to,error,params,retry,retryCount}){ }
    async onInitialLeave({from,to,error,params,retry,retryCount}){ }
    async onInitialDone({from,to,error,params}){ }
    async onInitialResume({from,to,error}){ }
    async onInitial({from,to,error,params}){ }
  
    async onConnectingEnter({from,to,error,params,retry,retryCount}){...}
    async onConnectingLeave({from,to,error,params,retry,retryCount}){...}
    async onConnectingResume({from,to,error,params,retry,retryCount}){ }
    async onConnectingDone({from,to,error,params})
    async onConnecting({from,to,error,params})
                                       
    async onConnectedEnter({from,to,error,params,retry,retryCount}){...}
    async onConnectedLeave({from,to,error,params,retry,retryCount}){...}
    async onConnectedResume({from,to,error,params,retry,retryCount}){...}
    async onConnected({from,to,error,params}){...}
    async onConnectedDone({from,to,error,params}){...}
    ......
}    
```

**注意：**

   - 在类中声明的钩子方法名称会使用状态名称**首字母大写形式**。
   - `on<State>`是`on<State>Done`的别名，如上例中，`onConnected`===`onConnectedDone`。一般只需要声明一个即可。

### **在状态中直接订阅事件**

```typescript
fsm.states.Connected.on("enter",({from,to,error,params,retry,retryCount})=>{ })
fsm.states.Connected.on("leave",({from,to,error,params,retry,retryCount})=>{ })
fsm.states.Connected.on("done",({from,to,error,params})=>{ })
fsm.states.Connected.on("resume",({from,to,error})=>{ })
```

### 订阅状态转换事件 

```typescript
fsm.on("Connected/enter",({from,to,error,params,retry,retryCount})=>{})
fsm.on("Connected/leave",({from,to,error,params,retry,retryCount})=>{ })
fsm.on("Connected/done",({from,to,params})=>{ })
fsm.on("Connected/resume",({from,to,error,params,retry,retryCount})=>{ })
```

## 钩子事件参数

钩子函数的参数如下：

   - `from: string`：上一个状态
   - `to: string`：下一个状态
   - `params:any`：转换时传入的参数
   - `error: Error | undefined`:  发生错误时的错误
   - `retryCount`和`retry`：用于进行重试的参数，详见错误重试说明。

## 阻止转换过程

状态转换除了受`state.next`约束外，还可以通过状态转换钩子来**拦截**约束。状态转换钩子函数在状态转换其间调用，可以**对转换行为进行拦截**并作出相应的**拦截处理**。

- **通过返回**`false`**来明确阻止转换过程。**

```typescript
class MyStateMachine extends FlexStateMachine{
    async onInitialLeave({from,to,error,params,retry,retryCount}){
       // ...
       return false           // 返回false代表不充许离开Initial状态。
    } 
}    
```

- **通过触发错误来阻止转换过程**

```typescript
class MyStateMachine extends FlexStateMachine{
    async onInitialLeave({from,to,error,params,retry,retryCount}){
       // ...
       throw new Error()
    } 
}    
```

- **通过触发**`SideEffectTransitionError`**来阻止转换到错误状态**

```typescript
class MyStateMachine extends FlexStateMachine{
    async onInitialLeave({from,to,error,params,retry,retryCount}){
       // ...
       throw new SideEffectTransitionError()
    } 
}    
```

当钩子函数触发`SideEffectTransitionError`时**代表着在该钩子函数中产生了不可消除的副作用**，将使状态机转换到`ERROR`状态。`ERROR`状态是一个`FINAL`状态，代表状态机处于最终状态。后续只能通过`reset`方法来重置状态机。

## 错误处理

转换状态或者执行动作均可能会出错，出错有可能会产生了副作用，最主要的表现形式就是上下文数据被污染了，必须提供正确的错误处理才可以确保状态机的工作正常。当状态机发生错误时，常见的处理方式是：

- 如果没有产生严重的副作用，则一般会进行重试恢复。
- 如果产生难以消除的副作用，则应重置状态机。

当调用`transition`方法来转换状态时，会依次调用状态的`<当前状态>/leave`，`<目标状态>/enter`、`<目标状态>/done`钩子函数。其中`leave`/`enter`这两个拦截钩子可以通过触发错误来阻止状态的转换。那么问题来了，**当拦截钩子触发错误时，应该怎么处理错误？**

- **当前状态是`A`，执行`transition("B")`，先执行`A/leave`离开`A`状态，然后执行`B/enter`时出错了，也就是说无法进入到`B状态`，此时状态机应该处于什么状态？**

此时可以恢复到A状态，但是问题是我们在`A/leave`时已经离开了`A`状态，由于在`A/leave`时已经干了一个不可描述的事（**产生的副作用了，已经污染了上下文**），那么要简单地恢复到A状态就应需要同时**恢复上下文**相关的数据，否则就可能造成数据混乱，并且可能在下次`A/leave`时产生业务混乱。可见，如果恢复到A状态，我们需要同时恢复当前的上下文数据。因此，问题就取决于，我们是否可以恢复上下文数据。如果可以，那么就可以安全的恢复到A状态；如果不行，则应该将状态机置为错误状态，让应用对状态机进行重置。

- **当前状态是**`A`**，执行**`transition("B")`**，先执行**`A/leave`**离开**`A`**状态时出错**

取决于在`A/leave`函数里面产生了多少副作用，如果产生的副作用是可消除的，则当前状态应保持不变； 如果副作用不可消除，则应该转换到错误状态，然后通过重置状态机来重新恢复上下文以消除副作用。

因此，**当拦截钩子触发错误时，错误处理方式就有两种：**

- **如果产生的副作用是可消除的，则触发错误或返回false时回退到原始状态**
- **如果产生的副作用是不可消除的，则触发`SideEffectTransitionError`转换到ERROR状态**

状态机提供了相应的方法来处理这些副作用。

### 重试

所有的钩子函数均传入`retry`和`retryCount`两个参数用来实现重试操作。当产生的副作用是可消除的时，可以由开发者来自行决定如何进行重试。

- **`retry(interval)`** ：重试函数，能指定重试间隔
- **`retryCount`** ：代表第几次重试

```typescript
import {RetrySignal } from "FlexStateMachine"
class MyStateMachine extends FlexStateMachine{
    async onALeave({from,to,retry,retryCount}){
       try{
           // .....干活，产生副作用，污染了上下文....
       }catch(e){
           // 如果副作用是可消除的，则进行重试
           if(retryCount<3){					 // 第几次重试
             retry(1000)						   // 延迟1秒后重试
           }else{
              throw e								// 导致转换出错，将恢复原始状态
           }
       }        
    }  
}    
// 上述retryCount<3时重试，就导致会重试3次，包括第一次执行，总共执行4次
```
### 触发转换错误 

当执行钩子函数失败时，**取决于在哪一个阶段出错**,其处理方式是不同的

#### 在`A/leave`出错

- 确认不会产生副作用，则只要抛出错误，状态机将保持状态不变。
- 如果确认会产生不可消除的副作用，则需要抛出`SideEffectTransitionError`，状态将转换到`ERROR`状态

```typescript
import { SideEffectTransitionError,FlexStateMachine } from "FlexStateMachine"
class MyStateMachine extends FlexStateMachine{
    async onALeave({from,to,retryIndex}){
       try{
           // .....干活，是否产生副作用，污染了上下文？？？
       }catch(e){           
         // 产生错误时可以有两个选择：
         // 1、如果确认没有产生副作用，则可以直接抛出错误，状态将保持不变
         throw e                				
         // 2、如果确认会产生不可消除的副作用，则需要抛出SideEffectTransitionError，状态将转换到ERROR状态
         throw new SideEffectTransitionError()  
       }        
    }
    async onBEnter(){      
        throw new Error()    
    }
}   
```

#### 在`B/enter`出错

如果在`B/enter`阶段产生错误，则需要在`a/resume`回调中处理消除副作用。如果`a/resume`也抛出错误，则会转换到错误状态。

```typescript
import {RetrySignal } from "FlexStateMachine"
class MyStateMachine extends FlexStateMachine{
    async onALeave({from,to}){ }
    async onAResume({from,to}){
      // 当b/enter出错后，应该重新恢复到A状态，可以在此消除ALeave产生的的副作用。执行后会恢复到A状态
      ......
    }
    async onBEnter(){      
        throw new Error()    
    }
}

```
由于在`A->B`的转换过程中会先执行`A/leave`，在其中可能会产生副作用。因此在`B/enter`出错时（即无法进入B状态），触发`A/resume`事件，开发者可以在`A/resume`钩子中来消除副作用。如果`A/resume`钩子函数中能成功消副作用，则状态机将保持在A状态；如果`A/resume`钩子函数触发了错误，则代表着无法消除副作用，因此状态机将转换到`ERROR`状态。

### 转换到ERROR状态

如果开发者明确钩子函数产生的副作用是不可消除的，则可以通过`throw new SideEffectTransitionError()`来强制转换到`ERROR`状态。此时状态机会直接触发`ERROR/done`事件，但是不会触发`<当前状态>/leave`和`ERROR/enter`事件。

```typescript
class MyStateMachine extends FlexStateMachine{
    async onALeave({from,to}){
        throw new SideEffectTransitionError()
    }
    async onAResume({from,to}){
      throw new SideEffectTransitionError()
    }
    async onBEnter(){      
        throw new SideEffectTransitionError()
    }
}
```

## 转换事件
状态转换过程中的钩子事件订阅：

```typescript
let fsm = new FlexStateMachine({ })
// 在状态机上订阅
fsm.on("<状态名称>/enter",callback)
fsm.on("<状态名称>/leave",callback)
fsm.on("<状态名称>/done",callback)
fsm.on("<状态名称>/resume",callback)
//在状态上订阅
fsm.states.[状态名称].on("enter",callback)
fsm.states.[状态名称].on("leave",callback)
fsm.states.[状态名称].on("done",callback)
fsm.states.[状态名称].on("resume",callback)

```

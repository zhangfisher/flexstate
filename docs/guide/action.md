# 动作

动作(`action`)用来执行某个副作用并导致状态发生变化，属于**主动进行状态转换**。

:::warning 最佳实践
通过执行动作来触发状态变化，而不是直接修改状态！
:::

## 动作参数

动作可以通过多种方式进行定义，动作参数如下：

```typescript
 {
    name         : "<动作名称>",			// 指定唯一的动作名称
    alias        : "<动作别名>",			// 动作别名，当在实例中注入同名的方法时，如果指定别名，则使用该别名
    when         : [<状态>,...,<状态>],     // 指定该动作仅在当前状态是when中的一个时才允许执行动作
    pending      : "<状态>",                // 开始执行动作前切换到pending状态
    execute      : async (param)=>{.....}   // 动作执行函数，具体干活的   
    resolved     : "<状态>",                // 执行成功后切换到resolved状态
    rejected     : "<状态>",                // 执行失败后切换到rejected状态
    finally      : "<状态>",               // 无论执行成功或失败均切换到finally状态

}
```

其中`pending/resolved/rejected/finally`四个参数代表了动作执行阶段的状态值。除了直接指定状态名称外，还可以是返回状态的函数。

```typescript
 {
   // 开始执行动作前切换到pending状态
    pending      : (param)=>{
      // param是执行参数
      return "<状态名称>"           // 返回pending时的状态名称
    },                			
    // 执行成功后切换到resolved状态
    resolved     : (result)=>{
      // result是execute返回的值
      return "<状态名称>"										  
    },      
    // 执行失败后切换到rejected状态
    rejected     :  (error)=>{
      // error是execute执行出错的错误
      return "<状态名称>"										  
    },      
    // 无论执行成功或失败均切换到finally状态
    finally      :  (result)=>{
      if(result instanceOf Error){
        // 执行出错
      }else{
        // 执行成功
      }
      return "<状态名称>"										  
    },                			
    timeout      : 0,                						 // 指定动作执行超时时间
}

```
## 定义动作

动作可以通过三种方式进行定义：

### 在构建参数中传入
```typescript
const fsm = new FlexStateMachine({
  actions:{
      "<动作名称>":{
        //....动作定义....
        },
       "<动作名称>":{
        //....动作定义....
        },      
  }
})
```
### 使用@state装饰器声明

```typescript
import { state, FlexStateMachine } from "flexstate"
class MyStateMachine extends FlexStateMachine{
  @state({....动作参数....})
  async connect(param){
     // ....
  }
  @state({....动作参数....})
  async disconnect(param){
     // ....
  }
}
```
### 注册动作

```typescript
const fsm = new FlexStateMachine({...})
                                   
fsm.register({
    name:"<动作名称>",
    //....动作声明参数....
})
```

## 执行流程

执行状态机动作会导致状态变化，动作执行流程如下：

-  执行动作前，先检查当前状态是否在`when`参数中指定，如果不允许执行触发错误。
- 然后如果指定`pending`参数，则状态机会先切换至`pending`指定的状态。 
-  然后执行`execute`指定的函数：
   - 如果执行成功，则状态机会切换至`resolved`指定的状态。如果没有指定`resolved`参数，则会恢复到原始状态。如果曾经切换到`pending`状态，则需要则会保持在`pending`状态，开发者需要自行处理状态副作用。比如上例中`connect`动作没有指定`resolved`状态，则在执行`connect`前切换到`Connecting`状态，执行成功后，就会保持在`Connecting`状态，这明显就不合理。那么StateMachineSignal如果回退到原始的`Initial`状态呢，当然也是不合理的，因为有可能在`Initial/leave`和`Connecting/enter`钩子函数中已经做了一些会产生副作用的事。因此，开发者正常情况下，应该为动作的成功执行指定一个`resolved`状态。
   - 如果失败（即触发错误）则状态机切换至`rejected`指定的状态。 同样地，当指定`pending`状态时，一般也应该为执行失败指定一个`rejected`状态。
-  也可以为动作执行指定一个`timeout`，当动作执行超时时，状态机就会切换至`rejected`指定的状态。 
-  也可以指定一个`finally`值，即无论状态动作执行成功与否，执行完成后均会切换到`finally`指定的状态。 此时指定的`resolved`和`rejected`状态就无效。
-  `pending`、`rejected`、`rejected`、`finally`均支持指定一个函数，如下： 上述的`result`就是`execute`执行的返回值，因此可以动态返回一个状态值。 

```typescript
 actions:{
        connect:{  
            ...
            execute:async (params)=>{
                return 1           
            },
            resolved:( result)=>{
                retrun result>0 : "Connected": "Disconnted"
            }
        }
 }
```
## 动作函数
一般情况下，动作函数应该是一个异步函数，当然也支持同步函数。动作函数就是一个普通的函数。

- 可以为动作函数的执行指定一个`timeout`，当执行超时就会产生错误。
## 实例动作方法
默认情况下，状态机会为每一个动作生成同名的实例方法。

```typescript
import { state, FlexStateMachine } from "flexstate"
class MyStateMachine extends FlexStateMachine{
  @state({....动作定义....})
  async connect(param){
     // ....
  }
  @state({....动作定义....})
  async disconnect(param){
     // ....
  }
}

let fsm = new MyStateMachine({})
// 两个同名的封装方法
await fsm.connect()
await fsm.disconnect()
fsm.register({
  name:"reconnect",
  //....
})

await fsm.reconnect(...)

```

- 生成的同名实例方法是经过状态机封装后的同名方法。
- 可以通过配置状态机参数`injectActionMethod=false`来禁止生成实例方法。
- 默认情况下，动作实例方法出错时不会产生错误，如下：

```typescript
// 使用别名来生成实例方法
try{
  await fsm.connect()
}catch(e){
  // 不会产生错误
}
```
也就是说如果上例中的`fsm.connect`方法如果执行出错，则会按`resolved/rejected/finally`配置进行状态转换，但是不会抛出错误给开发者。通过配置`throwActionError`配置参数，可以允许抛出错误。

```typescript
let fsm = new MyStateMachine({
  throwActionError:true
})
// 使用别名来生成实例方法
try{
  await fsm.connect()
}catch(e){
  // 可以在此捕获错误
}
```

- 如果自动生成同名实例方法存在与实例名称冲突，则可以为动作指定一个别名。

```typescript
class MyStateMachine extends FlexStateMachine{
  @state({
    alias:"ConnectTo"
  })
  async connect(param){
     // ....
  } 
}
let fsm = new MyStateMachine({})
// 使用别名来生成实例方法
await fsm.ConnectTo()
```
当为状态机指定了不一样的`context`参数时，同名动作方法将被绑定到`context`对象上。可参考快速入门例子。

## 执行动作
支持两种方式来执行动作：

- 可以通过状态机实例的同名动作函数来执行动作，上例中可以直接调用`fsm.connect`来执行动作。
- 直接调用封装后的动作方法，即`fsm.actions[<动作名称>](param)`来执行动作。
```typescript
// 执行动作
await tcp.connect()
await tcp.actions.connect()   // 不应该状态转换钩子中调用
```
两种执行动作的区别在于：

- 调用实例方法（例：`tcp.connect()`）默认永远不会抛出错误，需要在动作的`rejected`参数中处理错误。
- 直接调用动作方法会抛出错误。

推荐通过调用实例方法的形式来执行动作，因此实例动作方法实质上内部通过`setTimeout(<动作函数()>,0)`来执行动作，这样设计的目的是，让动作方法可以从状态转换调用链中剥离。

## 执行反馈
执行动作会产生副作用，从而导致状态发生变化。但是副作用的产生又分为可预期和不可预期的，因此当执行动作后，如何转换状态就需要分开进行处理。

- **当动作执行是可预期的时：**

也就是说动作执行成功或出错是相对明确的，可以直接指定动作的`resolved/rejected/finally`来自动配置动作执行后的状态。

- **当动作执行是不可预期的时：**

也就是说动作执行取决于外部模块（主要是通过事件触发进行反馈），就像tcp客户端中，当调用`connect`或`disconnect`方法时，是否成功不仅取决于本地代码，还取决于服务器的行为；此种情况下，就没有必须指定`resolved/rejected/finally`参数。

## 错误处理
当动作函数执行完毕后，状态机将根据执行结果转换到`resolved/rejected/finally`指定的状态。如果指定的状态是无效的，或者转换失败，则状态机将转换到`ERROR`状态。这种情况下，就只能通过`reset`方法来重置整个状态机。

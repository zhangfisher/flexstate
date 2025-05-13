# 子状态

子状态指每个状态内部还具有自己的状态，在实际项目中是比较常见的，比较快速入门例子中当进行连接状态后：

- 客户端需要在准备认证、已认证、认证成功、认证失败等状态中切换，相当于Connected内部具有一个独立的子状态机。
- 当状态机离开`Connected`时，无论其处于`Connected`内部独立的子状态机处于何种状态，均应该停止。

## 创建子状态
`FlexStateMachine`也支持两种方式来创建子状态。

- **调用状态的**`createScope`**方法**

每个状态均可以调用`createScope`方法来创建独立的状态机，`createScope`方法返回是一个`FlexStateMachine`实例，称为**子状态机**。

```typescript
let tcp = new TcpClient({})

let connectedFsm = tcp.states.Connected.createScope({
  // ...状态机参数...
  states:{.....},
  actions:{......},
           
})
tcp.states.Connected.scope === 指向的就是创建的状态机实例
```
## 配置子状态

```typescript
class TcpClient extends FlexStateMachine{
  static states = {
    Connected:{
      scope:{
          Unauthenticated : {value:0,title:"未认证",initial:true,next:["Authenticating"]},
          Authenticating  : {value:1,title:"正在认证",next:["Authenticated"]}
          Authenticated   : {value:2,title:"已认证",next:["Unauthenticated"]},
      }
    },
    ....
  }
```
## 生命周期

- 当进入父状态时(`<父状态>/done`)时启动子状态机（即调用子状态机的`start`方法）；当进入离开父状态时(`<父状态>/leave`)时停止子状态机（即调用子状态机的`stop`方法）
- 停止子状态机后，子状态后的行为与普通状态机一样，没有任何特别的行为，详见上文<`停止状态机`>介绍。
- 当状态机进入`ERROR`状态时也会导致子状态机停止。

## 上下文
子状态机的`context`默认与父状态机的`context`一样。这意味着可以将子状态的转换钩子也定义在与父状态相同的类上。
```typescript
class TcpClient extends FlexStateMachine{
  static states = {
    Connected:{
      scope:{
          Unauthenticated : {value:0,title:"未认证",initial:true,next:["Authenticating"]},
          Authenticating  : {value:1,title:"正在认证",next:["Authenticated"]}
          Authenticated   : {value:2,title:"已认证",next:["Unauthenticated"]},
      }
    }  
  }
  // Conneted子状态的转换钩子事件也可以定义在父状态的类上
  onUnauthenticatedLeave({from,to}){...}
  onUnauthenticatedEnter({from,to}){...}
  onUnauthenticated({from,to}){...}

  onAuthenticatingLeave({from,to}){...}
  onAuthenticatingEnter({from,to}){...}
  onAuthenticating({from,to}){...}
  
  onAuthenticatedLeave({from,to}){...}
  onAuthenticatedEnter({from,to}){...}
  onAuthenticated({from,to}){...}
} 
  
```
## 嵌套子状态
`FlexStateMachine`理论上可以嵌套任意多层的子状态，从而形成复杂的状态树。但是当嵌套了非常多的子状态后会导致状态机变得非常复杂，我们不推荐也不应该创建一个很大很复杂状态机。

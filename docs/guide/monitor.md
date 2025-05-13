# 状态转换监控

除了状态转换钩子函数外，在状态转换过程还会触发转换生命周期监控事件。状态转换监控事件与状态钩子的区别在于，状态转换监控事件不能干预转换过程，并且执行时会忽略错误，一般用于监视状态机的运行使用。

- **transition/begin**

转换开始前触发，事件参数 `{event:"BEGIN",from,to}`

- **transition/end**

转换结束后触发，事件参数` {event:"END",from,to}`

- **transition/cancel**

当转换被取消时触发，事件参数 `{event:"CANCEL",from,to}`

- **transition/error**

当转换出错时触发，事件参数` {event:"CANCEL",error,from,to}`注意，转换生命周期事件不能像钩子函数一样通过触发错误来阻止和干预转换过程，其执行错误将被忽略。转换生命周期事件可以通过以下三种方式订阅。


## 在类中定义订阅
```typescript
class MyStateMachine extends FlexStateMachine{
    async onTransitionBegin({event,from,to}){ } 
    async onTransitionEnd({event,timeConsuming,from,to}){ }  // timeConsuming值是本次转换的耗时
    async onTransitionCancel({event,from,to}){ } 
    async onTransitionError({event,error,from,to}){ } 
    async onTransition({event,timeConsuming,error,from,to}){ } 
}    
```
其中`onTransition`同时订阅所有转换事件。
## 在构建参数中传入
```typescript
const fsm = new FlexStateMachine({
    states:{...},
    onTransitionBegin:async ({event,from,to}){ }, 
    onTransitionEnd:async ({event,timeConsuming,from,to}){ },
    onTransitionCancel:async ({event,from,to}){ }, 
    onTransitionError:async ({event,error,from,to}){ },
    onTransition:async ({event,timeConsuming,error,from,to}){ }, 
})    
```
## 直接事件订阅
```typescript
const fsm = new FlexStateMachine({...})    
fsm.on("transition/begin",async ({event,from,to}){ })
fsm.on("transition/end",async ({event,timeConsuming,from,to}){ })
fsm.on("transition/cancel",async ({event,from,to}){ })
fsm.on("transition/error",async ({event,error,from,to}){ })
```
## 记录转换历史

状态机具有一个`history`的参数，启用后可以记录状态机的转换历史记录，通过`fsm.history`可以访问。`history=<数字>`代表要记录最后几条转换历史，如`history=100`代表要记录最后`100`条转换历史，超过会不记录。`fsm.history`格式如下：
```typescript
fsm.history=[
  [timestamp,state],
  [timestamp,state],
  [timestamp,state],
  [timestamp,state],
  ......
]
```
转换历史记录可供进行状态机的诊断使用。 

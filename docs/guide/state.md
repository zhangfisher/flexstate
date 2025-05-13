# 状态
## 声明状态
定义状态有两种方法：

-  **在类中定义静态变量states**  

```typescript
class TCPClient extends FlexStateMachine{    
    static states={...}             // 定义状态
}
```

-  **在构造参数中传入states**  

```typescript
new TCPClient({
    states:{......}
})
```

- 如果同时指定了`static states`和`构造参数中传入states`，则两者会进行合并，**构造参数中传入states优先**。

## 状态数据

- **状态数据结构**

```typescript
{
  states:{
    [状态名称]:{
        name?   : string,                             // 状态名称,一般为英文
        value   : number | null,                      // <必须，状态值，Number类型>,
        alias?  : string | undefined,                 // 可选，状态别名                                 
        title?  : string,                             //<状态标题，一般用于显示> 
        initial?: boolean,                            // <true/false,是否是初始化状态,只能有一个状态为初始状态>, 
        final?  : boolean,                            // <true/false,最终状态>                                                  
        enter?  : FlexStateTransitionHookExt,         // 当进入该状态时的钩子
        leave?  : FlexStateTransitionHookExt,         // 当离开该状态时的钩子
        done?   : FlexStateTransitionHookExt,		  // 当已切换至状态后
        resume? : FlexStateTransitionHookExt,         // 当离开后再次恢复时调用
        next?   : FlexStateNext                       // 定义该状态的下一个状态只能是哪些状态,也可以是返回下一个状态列表的函数,*代表可以转换到任意状态
        [key    : string]:any                         // 额外的参数
    },
    [状态名称]:{......},
    [状态名称]:{......},  
    [状态名称]:{......},
    ...
  }
}
```

- **实例属性直接访问状态值**。

当状态机实例化后，可以通过**实例属性直接访问状态值**。

```typescript
fsm[<状态名称大写>]  == 状态值
fsm[<状态名称>]     == 状态数据
// 例：
fsm.INITIAL == 0
fsm.CONNECTING ==1
fsm.CONNECTED == 2
fsm.DISCONNECTING == 3
fsm.DISCONNECTED == 4
```

这种行为可以通过配置状态机参数`injectStateValue=false`来关闭。

- **访问状态数据**

通过`fsm.states`可以访问所有定义的状态。

```typescript
fsm.states === {Initial:{...},Connecting:{...},Connected:{...},Disconnecting:{...},Disconnected:{...},ERROR:{.....}}
```

- **访问当前状态**

通过`fsm.CURRENT`访问当前状态值，通过`fsm.current`访问当前状态。

## 状态别名

当在类中定义状态钩子时，如果存在名称冲突时可以指定状态别名。
例如：

```typescript
class MyStateMachine extends FlexStateMachine{
    static states = {
        test:{}
    }
    // 原来的类方法
    onTest(){
    }
    onTestEnter(){}
    onTestDone(){}
    onTestLeave(){}
}
```

假设很不幸`MyStateMachine`类本身存在一个`onTest`方法，且定义了一个`test`状态。在此情况下，旧的`onTest`方法就与状态机的钩子函数冲突了。此时就可以为`test`状态指定一个别名：

```typescript
class MyStateMachine extends FlexStateMachine{
    static states = {
        test:{
            alias:"debug"
        }
    }
    // 原来的类方法
    onTest(){
    }
    onDebug(){  }
    onDebugEnter(){}
    onDebugDone(){}
    onDebugLeave(){}
}
```

## 特殊状态
### IDLE
状态机实例化后，还没有调用`start`方法前的特殊状态，代表状态机还没有开始运行。当调用`start`方法后，将转换至**转换到**`initial=true`的状态。并且`IDLE`状态没有相对应的钩子事件和转换事件，也就是说不会触发`onIdleEnter/onIdleLeave/onIdle`这样的钩子函数。
### INITIAL
当指定状态`initial=true`时代表这是一个初始状态，状态机有且只能有一个`initial=true`。如果没有指定则会自动取第一个状态为初始状态。
### FINAL

状态机允许有零或多个最终状态 (`final states`)，当状态机处于`FINAL`状态时，不允许再转换至其他任意状态。只能通过只能通过`reset`方法来重置状态机。

### ERROR

当状态机执行动作出错或者转换状态出错等情况下，可能转换到`ERROR`状态。

- `ERROR`状态是一个特殊的`FINAL`状态，因此一旦转换至`ERROR`状态后，就只能通过`reset`方法来重置状态机。
- **任何状态**均可以直接转换到`ERROR`状态。
- 状态机有且只能有一个`ERROR`状态，状态值=`{name:"ERROR",value:Number.Number.MAX_SAFE_INTEGER}`
- 状态机会自动创建一个`ERROR`状态。

关于错误状态处理的更详细介绍见后续错误处理章节说明。

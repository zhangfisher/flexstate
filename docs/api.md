# API

`flexstate`只有一个`FlexStateMachine`类。

# 构造参数

```typescript
export interface FlexStateOptions extends FlexStateTransitionHooks,LiteEventEmitterOptions{
    name?               : string,                // 当前状态机名称
    states?             : FlexStateMap,          // 状态声明
    parent?            : FlexState,              // 父状态实例
    context?           : any,                    // 当执行动作或状态转换事件时的this指向
    autoStart?         : boolean,                // 是否自动开始运行状态机，=false需要调用.start()
    actions?           : FlexStateActionMap,     // 动作声明
    injectActionMethod?: boolean,                // 将动作方法注入到当前实例中
    throwActionError?  : boolean,                // 是否在执行动作方法时抛出错误
    injectStateValue?  : boolean,                // 在实例中注入：大写状态名称的字段，其值 =状态值
    history?           : number                  // 记录状态转换历史，0=不记录，N=最大记录N条历史
    scope?             : FlexStateMachine,       // 内部独立子状态域
}  

```

# 属性

## name

状态机名称，默认等于当前类名

- **类型**：`string`

## context

定义状态机的上下文对象，默认等于当前状态机实例。flexstate从`context`读取：

- `static states`
- `static actions`
- 所有状态钩子
- 所有状态监视事件

## parent

返回当前状态机父状态
- **类型**：`FlexState`

## scope

父状态所在的状态机实例
- **类型**：`FlexStateMachine`

## running

状态机是否处于运行状态
- **类型**：`boolean`

## actions
已注册的动作列表
- **类型**：

```typescript
export interface FlexStateAction{
    name?         :string,                                      //指定唯一的动作名称
    alias?        : string,  									// 动作别名，当在实例中注入同名的方法时，如果指定别名，则使用该别名
    injectMethod? : boolean,                                    // 是否上下文对象中注入同名的方法
    // 指定该动作仅在当前状态是when中的一个时才允许执行动作
    when?         : string | Array<string> | ((params:Object,current:FlexState)=>Array<string>),       		                
    pending?      : string | Function,                			// 开始执行动作前切换到pending状态
    resolved?     : string | Function,                			// 执行成功后切换到resolved状态
    rejected?     : string | Function,                			// 执行失败后切换到rejected状态
    finally?      : string | ((params:Object)=>Array<string>)   // 无论执行成功或失败均切换到finally状态
    execute(...args:any[]):void                                 // 动作执行函数，具体干活的
    [key:string]:any
} 

// 动作列表{[name]:<FlexState>}
export type FlexStateActionMap= Record<string,FlexStateAction>
```
## CURRENT
返回当前状态值
- **类型**：`number`

## current
返回当前状态
- **类型**：`FlexState`

## initial
返回初始状态
- **类型**：`FlexState`

## transitioning
返回是否正在进行状态lfrq
- **类型**：`boolean`

## history
当配置`options.history`大于零时，返回状态转换历史

- **类型**：`Array<[number,string]>`
- **返回值**：

```typescript
`[
    [<时间戳>，<状态名称>],
    [<时间戳>，<状态名称>],
    [<时间戳>，<状态名称>],
    .....
]`
```

## options

状态机配置参数

- **类型**： `Required<FlexStateOptions> & LiteEventEmitterOptions`

```typescript
interface FlexStateOptions extends FlexStateTransitionHooks,LiteEventEmitterOptions{
    name?               : string,                       // 当前状态机名称
    states?             : FlexStateMap,                 // 状态声明
    parent?            : FlexState,                     // 父状态实例
    context?           : any,                           // 当执行动作或状态转换事件时的this指向
    autoStart?         : boolean,                       // 是否自动开始运行状态机，=false需要调用.start()
    actions?           : FlexStateActionMap,            // 动作声明
    injectActionMethod?: boolean,                       // 将动作方法注入到当前实例中
    throwActionError?  : boolean,                       // 是否在执行动作方法时抛出错误
    injectStateValue?  : boolean,                       // 在实例中注入：大写状态名称的字段，其值 =状态值
    history?           : number                         // 记录状态转换历史，0=不记录，N=最大记录N条历史
    scope?             : FlexStateMachine,              // 内部独立子状态域
}  

```

# 方法

## start
启动状态机


## stop
停止状态机

## reset
重置状态机

## getState

返回状态数据。

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| param   | `FlexStateArgs | Function`  |  `状态名称 | 状态值 | 或返回状态名称或值的函数` |
| args   |  `Array<any>`  | 当param是一个函数时用来额外传递给函数的参数  |

- **返回类型**： 

`FlexState`

- **示例**

```typescript
    states={ready:{name:"ready",value:1,title:"准备就绪"}}

    getState(1)  // == states.ready
    getState("ready") // == states.ready
    getState(()=>"ready") // == states.ready
    getState(()=>1) // == states.ready
    getState({name:"ready",...}) // ==  states.ready
```

## add

注册一个新的状态

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| state   | `NewFlexState`  | 状态数据 |

- **返回类型**： 

无


## remove

移除存在的状态

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| name   | `string`  | 状态名称 |

- **返回类型**： 

无



## isValid

返回输入参数是否是有效的状态

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| state   | `any`  | 状态名称 / 状态值 / FlexState / Function |

- **返回类型**： 

`boolean`

## isCurrent

返回输入参数是否是当前状态

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| state   | `any`  | 状态名称 / 状态值 / FlexState / Function |

- **返回类型**： 

`boolean`


## isFinal

返回是否处于最终状态

- **参数**：

无

- **返回类型**： 

`boolean`


## register

注册状态动作

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| action   | `FlexStateAction`  | 状态动作参数 |

- **返回类型**： 

无



## unregister

注销状态动作

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| name   | `string`  | 状态动作名称 |

- **返回类型**： 

无



## cancel

停止正在执行的状态转换，执行后会触发`transition/cancel`事件，并且正在执行的钩子函数时会触发`CancelledTransitionError`

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| name   | `string`  | 状态动作名称 |

- **返回类型**： 

无


## transition

转换到指定状态

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| next   | `FlexStateArgs`  | 下一个状态 |
| params   | `any`  | 额外的参数，被传递给钩子函数 |

- **返回类型**： 

无


## canTransitionTo

判断是否可以从当前状态转换到指定状态

```typescript
    canTransitionTo(fromState:FlexStateArgs, toState?:FlexStateArgs):boolean 
    canTransitionTo(toState:FlexStateArgs):boolean
    canTransitionTo():boolean
```

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| fromState   | `FlexStateArgs`  | 从该状态 |
| toState   | `FlexStateArgs`  | 转换到此状态 |

- **返回类型**： 

是否转换成功
`boolean`

## execute

执行指定的动作

```typescript
    execute(name:string, ...args:any[]):void 
```

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| name   | `string`  | 动作名称 |
| args   | `any[]`  | 传递给动作函数的参数 |

- **返回类型**： 
无




## waitForState

等待状态机进入指定状态

```typescript
async waitForState(state:FlexStateArgs) 
``` 

- **参数**：

| 名称 | 类型 |  说明 |
| -- | -- | -- |
| state   | `FlexStateArgs`  | 状态名称或值 | 

- **返回类型**： 

`Promise`


## waitForInitial

等待进入初始状态
 
- **参数**：
 
 无

- **返回类型**： 

`Promise`



# 事件


# 类型

## FlexStateActionCallback

> type FlexStateActionCallback = 'pending' | 'resolved' | 'rejected' | 'finally' 

## FlexStateAction

```typescript
export interface FlexStateAction{
    name?         :string,                                      //指定唯一的动作名称
    alias?        : string,  									// 动作别名，当在实例中注入同名的方法时，如果指定别名，则使用该别名
    injectMethod? : boolean,                                    // 是否上下文对象中注入同名的方法
    // 指定该动作仅在当前状态是when中的一个时才允许执行动作
    when?         : string | Array<string> | ((params:Object,current:FlexState)=>Array<string>),       		                
    pending?      : string | Function,                			// 开始执行动作前切换到pending状态
    resolved?     : string | Function,                			// 执行成功后切换到resolved状态
    rejected?     : string | Function,                			// 执行失败后切换到rejected状态
    finally?      : string | ((params:Object)=>Array<string>)   // 无论执行成功或失败均切换到finally状态
    execute(...args:any[]):void                                 // 动作执行函数，具体干活的
    [key:string]:any
} 
```

## FlexStateActionMap

```typescript
// 动作列表{[name]:<FlexState>}
export type FlexStateActionMap= Record<string,FlexStateAction>
```
## FlexStateActionDecoratorOptions

状态动作装饰器参数

```typescript
export type FlexStateActionDecoratorOptions = Omit<FlexStateAction,"name" | "execute">
```
## FlexStateTransitionEventArguments
 状态转换监视事件参数
 
```typescript
export interface FlexStateTransitionEventArguments{
    event? : 'CANCEL' | 'BEGIN' | 'END' | 'ERROR'
    from  : string
    to    : string
    error?: Error 
    params?:any
    [key: string]:any
}
```
## FlexStateTransitionHookArguments

钩子参数 {from,to,error,params,retry,retryCount}

```typescript
export type FlexStateTransitionHookArguments = Exclude<FlexStateTransitionEventArguments,'event'> & {
    retryCount    : number                                                  // 重试次数,
    retry         : Function | ((interval?:number)=>void)                   // 马上执行重试
}
```

## FlexStateTransitionHook
状态转换钩子函数签名

```typescript
export type FlexStateTransitionHook = ((args:FlexStateTransitionHookArguments)=>Awaited<Promise<any>> | void ) | undefined  
```

## FlexStateTransitionHookExt

```typescript
export type FlexStateTransitionHookExt = FlexStateTransitionHook | [FlexStateTransitionHook,{timeout:number}]
```

## FlexStateNext

```typescript
export type FlexStateNext = string | Array<string> | (()=> Array<string> ) 
```

## NewFlexState

```typescript
export interface NewFlexState{
    name?   : string,                                               // 状态名称,一般为英文
    value   : number | null,                                        // <必须，状态值，Number类型>,
    alias?  : string | undefined,                                   // 可选，状态别名                                 
    title?  : string,                                               //<状态标题，一般用于显示> 
    initial?: boolean,                                              // <true/false,是否是初始化状态,只能有一个状态为初始状态>, 
    final?  : boolean,                                              // <true/false,最终状态>,                                                     
    enter?  : FlexStateTransitionHookExt,                           // 当进入该状态时的钩子
    leave?  : FlexStateTransitionHookExt,                           // 当离开该状态时的钩子
    done?   : FlexStateTransitionHookExt,			                // 当已切换至状态后
    resume? : FlexStateTransitionHookExt,                           // 当离开后再次恢复时调用
    next?   : FlexStateNext                                         // 定义该状态的下一个状态只能是哪些状态,也可以是返回下一个状态列表的函数,*代表可以转换到任意状态
    [key    : string]:any                                           // 额外的参数
}
```
## FlexState

状态声明

```typescript
export type FlexState = Required<NewFlexState> 
```
## FlexStateArgs
状态参数，用来传状态参数时允许只传递状态名称或{}

```typescript
export type FlexStateArgs = string | number | FlexState   
```
## FlexStateMap

```typescript
export type FlexStateMap = Record<string,NewFlexState> 
```
## NULL_STATE_TYPE

```typescript
export type NULL_STATE_TYPE = Pick<FlexState,'name' | 'value' | 'next' >
```

## ERROR_STATE_TYPE

```typescript
export type ERROR_STATE_TYPE = Pick<FlexState,'name' | 'value' | 'next' | 'final' >
```


## FlexStateEvents
 状态机事件 

```typescript
export enum FlexStateEvents {
    START = "start",
    STOP  = "stop",
    FINAL = "final",                         // 当状态机进入FINAL
    ERROR = "error"                          // 发生状态机运行错误时
}
```
## FlexStateTransitionEvents
转换事件

```typescript
export enum FlexStateTransitionEvents{
    BEGIN  = "transition/begin",                     // 开始转换前
    END    = "transition/end",                       // 转换结束后
    CANCEL = "transition/cancel",                    // 转换被取消：不允许转换时
    ERROR  = "transition/error",                     // 转换出错，主要状态回调事件执行出错
    FINAL  = "transition/final",                     // 转换到最终状态时
}
```

## FlexStateTransitionHooks
状态机转换钩子回调 

```typescript
export interface FlexStateTransitionHooks{
    onTransition?(params:FlexStateTransitionEventArguments):void;    
    onTransition?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionBegin?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionEnd?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionError?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionCancel?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
}
```

## TransitionHookTypes

```typescript
export type TransitionHookTypes = keyof FlexStateTransitionHooks
```
## FlexStateMachineContext
```typescript
export interface FlexStateMachineContext extends FlexStateTransitionHooks{    
    [key: string]:any
}
```

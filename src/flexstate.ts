import "reflect-metadata";
import { LiteEventEmitter,LiteEventEmitterOptions } from "flex-decorators/liteEventEmitter"
import timeoutWrapper from "flex-decorators/wrappers/timeout"
import { 
    getClassStaticValue,
    isPlainObject,
    flexStringArrayArgument, 
    flexStringArgument,
    delay
} from "./utils"
import { 
    StateMachineError,
    NotRunningError,
    InvalidStateError,
    FinalStateError,
    TransitionError,
    TransitioningError,
    CancelledTransitionError,
    ResumeTransitionError,
    SideEffectTransitionError
} from "./errors" 
import { getDecorators } from "flex-decorators";
import { DefaultStateParams, ERROR_STATE, NULL_STATE } from "./consts";



export type FlexStateActionCallback = 'pending' | 'resolved' | 'rejected' | 'finally' 

/**
 *
 * 状态动作
*/
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

/**
 * 状态动作装饰器参数
 */
export type FlexStateActionDecoratorOptions = Omit<FlexStateAction,"name" | "execute">

// 状态转换监视事件参数
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


/**
 * 状态转换钩子函数签名
 */
export type FlexStateTransitionHook = ((args:FlexStateTransitionHookArguments)=>Awaited<Promise<any>> | void ) | undefined  

export type FlexStateTransitionHookExt = FlexStateTransitionHook | [FlexStateTransitionHook,{timeout:number}]

export type FlexStateNext = string | Array<string> | (()=> Array<string> ) 

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
/**
 * 状态声明
 */
export type FlexState = Required<NewFlexState> 

// 状态参数，用来传状态参数时允许只传递状态名称或{}
export type FlexStateArgs = string | number | FlexState   

export type FlexStateMap = Record<string,NewFlexState> 

export type NULL_STATE_TYPE = Pick<FlexState,'name' | 'value' | 'next' >
export type ERROR_STATE_TYPE = Pick<FlexState,'name' | 'value' | 'next' | 'final' >


  
/**
 * 状态机事件
 */
export enum FlexStateEvents {
    START = "start",
    STOP  = "stop",
    FINAL = "final",                         // 当状态机进入FINAL
    ERROR = "error"                          // 发生状态机运行错误时
}



// 转换事件
export enum FlexStateTransitionEvents{
    BEGIN  = "transition/begin",                     // 开始转换前
    END    = "transition/end",                       // 转换结束后
    CANCEL = "transition/cancel",                    // 转换被取消：不允许转换时
    ERROR  = "transition/error",                     // 转换出错，主要状态回调事件执行出错
    FINAL  = "transition/final",                     // 转换到最终状态时
}


// 取消正在进行的转换,当发出此指令时，会让状态转换回调中止
const CANCEL_TRANSITION = "cancelTransition"        
const RESET_STATE_MACHINE = "resetStateMachine"        

const EnterStateEvent  = (name: string) => `${name}/enter`
const LeaveStateEvent  = (name: string) => `${name}/leave`
const DoneStateEvent   = (name: string) => `${name}/done`
const ResumeStateEvent = (name: string) => `${name}/resume`

/**
 * 状态机转换钩子回调
 */
export interface FlexStateTransitionHooks{
    onTransition?(params:FlexStateTransitionEventArguments):void;    
    onTransition?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionBegin?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionEnd?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionError?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
    onTransitionCancel?(params:FlexStateTransitionEventArguments):Awaited<Promise<any>>;
}

export type TransitionHookTypes = keyof FlexStateTransitionHooks

export interface FlexStateMachineContext extends FlexStateTransitionHooks{    
    [key: string]:any
}


/**
 * 状态机构造参数
 */
export interface FlexStateOptions extends FlexStateTransitionHooks,LiteEventEmitterOptions{
    name?               : string,                                     // 当前状态机名称
    states?             : FlexStateMap,                           // 状态声明
    parent?            : FlexState,                                  // 父状态实例
    context?           : any,                                        // 当执行动作或状态转换事件时的this指向
    autoStart?         : boolean,                                    // 是否自动开始运行状态机，=false需要调用.start()
    actions?           : FlexStateActionMap,                         // 动作声明
    injectActionMethod?: boolean,                                    // 将动作方法注入到当前实例中
    throwActionError?  : boolean,                                    // 是否在执行动作方法时抛出错误
    injectStateValue?  : boolean,                                    // 在实例中注入：大写状态名称的字段，其值 =状态值
    history?           : number                                      // 记录状态转换历史，0=不记录，N=最大记录N条历史
    scope?             : FlexStateMachine,                           // 内部独立子状态域
}  



 
export class FlexStateMachine extends LiteEventEmitter{  
    static states : FlexStateMap = {  }
    static actions: FlexStateActionMap = {}
    states        : Record<string, FlexState>= {}
    #initialState : FlexState = NULL_STATE as  FlexState                   // 初始状态
    #finalStates  : Array<string> = []                                     // 保存最终状态名称
    #currentState : FlexState = NULL_STATE  as  FlexState                  // 当前状态
    #transitioning: boolean = false                                        // 是否正在转换中
    #running      : boolean = false                                        // 是否处于运行状态
    #name         : string  = ''                                                // 状态机名称
    #history      : Array<[number,string]> = []                            // 状态转换历史=[[时间戳,状态名称],[时间戳,状态名称]]
    #actions      : {[name:string]:Function} = {}                          // 保存经过封装的动作
    #conflictMethods:Record<string,any> = {};
    [key:string]:any
    constructor(options : FlexStateOptions={}) {
        super(Object.assign({
            name              : "",                                         // 当前状态机名称
            parent            : null,                                       // 父状态
            context           : null,                                       // 当执行动作或状态转换事件时的this指向
            autoStart         : true,                                       // 是否自动开始运行状态机，=false需要调用.start()
            states            : {},                                         // 状态声明
            actions           : {},                                         // 动作声明
            injectActionMethod: true,                                       // 将动作方法注入到当前实例中
            throwActionError  : false,                                      // 是否在执行动作方法时抛出错误
            injectStateValue  : true,                                       // 在实例中注入：大写状态名称的字段，其值 =状态值
            history           : 0                                           // 记录状态转换历史，0=不记录，N=最大记录N条历史
        }, options)) 
        if(!this.options.context) this.options.context = this             //  
        this.#name = this.options.name || this.constructor.name
        this._addStates()                                                   // 所有状态声明
        this._addTransitionListeners()                                      // 扫描配置里面定义的所有状态侦听器
        this._registerActions()                                             // 注册动作
        this._addParentStateListener()                                      // 侦听父状态的进入与离开
        if(this.options.autoStart) this.start()                            // 自动开始切换
    }         

    /**************************** 公开属性 *****************************/
    get name(): string {return this.#name}    
    get context() { return this.options.context }                          // 状态机上下文实例
    get parent() { return this.options.parent }                            // 父状态
    get scope() { return this.options.scope }                              // 父状态所在的状态机实例
    get running() { return this.#running }                                  // 当前作用域  
    get actions() { return this.#actions }                                  // 已注册的动作列表={<name>:{....}}
    get CURRENT() { return this.current.value }                             // 当前状态值  
    get current() { return this.#currentState }                             // 当前状态，返回{name,value,....}
    get initial() { return this.#initialState }                             // 返回初始状态
    get transitioning() { return this.#transitioning }                      // 正在转换状态标志
    get history() { return this.#history }                                  // 返回状态历史
    get options():Required<FlexStateOptions> & LiteEventEmitterOptions{
        return super.options as Required<FlexStateOptions> & LiteEventEmitterOptions
    }                                 
    /**************************** 初始化 *****************************/
    private _addParentStateListener(){
        if(this.parent){
            // 当进入该父状态时启动子状态机
            this.parent.on("done",async ()=> await this.start())
            // 当要离开父状态时停止子状态机
            this.parent.on("leave",async ()=>await this._stop())  
            // 当父状态进入错误时也停止子状态机
            this.scope?.on(`ERROR/done`,async ()=>await this._stop())              
        }        
    }
    /**
     * 状态可以以下定义
     *  static states={...} <--- 构造参数
     *  
     * 
     * 规范化状态数据
     * state={
     *     name:"<状态名称>",
     *     value:<状态值>,                                              
     *     title:"<状态标题，一般用于显示>",            
     *     enter:async ({previous,context,params})=>{},                     // 转换到此状态的回调
     *     leave:async ({next,context})=>{},                                // 离开此状态时的回调
     *     next:[""]                                                        // 允许的下一个状态
     * }
     */
    private _addStates():void {        
        // 如果指定了父状态，则不读取context上面的states
        const staticStates:{[key:string]:FlexState} = this.parent ? {} : getClassStaticValue(this.context, "states")
        // static states <- this.options.states 
        const definedStates : {[key:string]:FlexState} = Object.assign({},staticStates, this.options.states)
        if(Object.keys(definedStates).length==0) throw new StateMachineError("未提供状态机定义")

        for (let [name, state] of Object.entries(definedStates)) {
            state.name = name
            let addedState:FlexState = this._add(state);          
            // 将状态值映射为实例的属性，可以直接以大写方式访问，如fsm.CONNECTED===state.value  
            (this as any)[name.toUpperCase()] = addedState.value;            
            if(addedState.initial) this.#initialState = addedState
            if(addedState.final) this.#finalStates.push(addedState.name)
        }                  
        // 如果没有指定初始状态，则默认使用第一个状态作为初始状态
        if (!this.isValid(this.#initialState)) {
            this.#initialState = this.states[Object.keys(this.states)[0]]
        }   
        // 自动添加一个错误状态                
        this.states["ERROR"] = Object.assign({},ERROR_STATE) as FlexState;
        (this as any)["ERROR"] = ERROR_STATE.value
    } 
    /**************************** 状态机管理 *****************************/
    /**
     * 触发状态机事件
     * @param {*} event 
     */
    private _emitStateMachineEvent(event:string,...args:Array<any>):void {
        try{
            this.emit(event,...args)
        }catch(e){}
    }

    /**
     * 开始运行状态机
     * 即转换到初始状态
     * 如果当前状态不为空，则直接返回
     */
    async start() {
        if(this.#running) return 
        this.#running = true        
        this._emitStateMachineEvent(FlexStateEvents.START)
        try{
            return await this.transition(this.#initialState)
        }catch(e){
            this._stop(e)
        }
    }
    private _stop(e?:any){
        if(this.#transitioning) this.emit(CANCEL_TRANSITION)
        this.#currentState = NULL_STATE as FlexState
        this.#running = false
        this._emitStateMachineEvent(FlexStateEvents.STOP,e)
    }
    /**
     * 停止状态机运行
     */
    async stop(){
        this._assertRunning()
        this._stop()
    }  

    /**
     * 重置状态机
     * 
     * 重置操作：
     *  - 取消正在进行的状态切换事件回调
     *  - 当前状态置为NULL_STATE
     * 
     */
    async reset() {
        await this.stop()
        await this.start()
    }
   /**************************** 状态管理 *****************************/

    /**
     *   注册切换侦听器

    *  - 在配置中传入
     *  - 类中定义
     * onTransitionBegin,onTransitionEnd,onTransitionCancel,onTransitionError回调
     *  - 
     */
    private _addTransitionListeners() {
        // onTransitionBegin,onTransitionEnd,onTransitionCancel,onTransitionError
        const context = this.context 
        const eventMap:Array<[string,TransitionHookTypes]> = [
            [FlexStateTransitionEvents.BEGIN, "onTransitionBegin"],
            [FlexStateTransitionEvents.END, "onTransitionEnd"],
            [FlexStateTransitionEvents.CANCEL, "onTransitionCancel"],
            [FlexStateTransitionEvents.ERROR, "onTransitionError"]
        ]
        // 定义在上下文实例中的回调
        if(context){
            eventMap.forEach(([event,method]) => {
                if(typeof(context?.[method])==="function"){
                    this.on(event,context[method].bind(context))
                }
            })     
            // onTransition相当于所有事件总
            if(typeof(context.onTransition)==="function"){
                Object.values(FlexStateTransitionEvents).forEach(event=>this.on(event,context.onTransition!.bind(context)))
            }       
        }
        // 定义在构造参数中的回调
        eventMap.forEach(([event,method]) => { 
            if(typeof(this.options[method])==="function"){
                this.on(event,this.options[method]!.bind(context))
            }
        }) 
        // onTransition相当于所有事件
        if(typeof(this.options.onTransition)==="function"){
            Object.values(FlexStateTransitionEvents).forEach(event=>this.on(event,this.options.onTransition!.bind(context)))
        }     
    }
    /**
     * 规范化状态数据
     * @param {*} state 
     * @returns 
     */
    private _normalizeState(state:FlexState):FlexState{
        let normaizedState:FlexState = Object.assign({},DefaultStateParams,state)
        if(!normaizedState.name) throw new StateMachineError("状态必须指定有效的名称")
        if(typeof(normaizedState.value)!="number") throw new StateMachineError("状态必须指定有效的状态值")

        // state.next可以是字符串、状态名称数组、或者函数,统一转换为[状态名称,状态名称,状态名称]或者是一个函数(在需要时调用)
        if (typeof (normaizedState.next) == "string") {
            normaizedState.next = [normaizedState.next]
        } else if (state.next === undefined) {
            normaizedState.next = []
        }else if(!Array.isArray(normaizedState.next) && typeof(normaizedState.next)!="function"){
            normaizedState.next = []
        }   
        if(typeof(normaizedState.next)!="function") normaizedState.next.push("ERROR")           // 任何状态均可以转换至错误状态
        return normaizedState
    }
    /**
     * 增加状态
     * @param state 
     * @returns 
     */
    private _add(state:FlexState):FlexState{
        const context = this.context
        let finalState:FlexState = this._normalizeState(state) 
        let stateName = finalState.name
        let stateAliasName = finalState.alias

        const hookEvents=["Enter","Leave","Done","Resume"]

        // 1. 注册在定义在状态中的enter/leave/done/resume回调       
        hookEvents.forEach(event=>{
            let method = finalState[event.toLowerCase()]
            if (typeof (method) == "function") {
                this.on(`${stateName}/${event.toLowerCase()}`, this._makeStateHookCallback(method).bind(context))
            }    
        }) 

        // 2. 订阅类中定义on<State>Enter、on<State>Resume,<State>Leave、on<State>End的函数，则自动注册其状态回调
        let firstUpperCaseStateName = `${stateName.slice(0,1).toUpperCase()}${stateName.substring(1).toLowerCase()}`
        let firstUpperCaseStateAliasName = stateAliasName ? `${stateAliasName.slice(0,1).toUpperCase()}${stateAliasName.substring(1).toLowerCase()}` : undefined
        hookEvents.forEach(event=>{
            const methodName = `on${firstUpperCaseStateAliasName || firstUpperCaseStateName}${event}`
            if (typeof(context[methodName]) === 'function'){
                this.on(`${stateName}/${event.toLowerCase()}`, this._makeStateHookCallback(context[methodName]).bind(context))
            }    
        }) 
        // 3. 为on<State>Done提供一个别名on<State>
        const methodName = `on${firstUpperCaseStateAliasName || firstUpperCaseStateName}`
        if (typeof(context[methodName]) === 'function'){
            this.on(`${stateName}/done`, this._makeStateHookCallback(context[methodName]).bind(context))
        }

        // 4. 为每一个状态生成一个 waitFor<State>异步等待方法，用来等待切换到该状态
        (this as any)[`waitFor${firstUpperCaseStateName}`]=async () =>await this.waitForState(stateName)

        // 5. 在状态机实例中注入一个大写的状态值字段，如Connected状态={value:1},则fsm.CONNECTED===1
        if(this.options.injectStateValue){
            this.context[stateName.toUpperCase()] == finalState.value
        }

        // 6. 为该状态提供一个创建子状态的方法
        if(isPlainObject(finalState.scope) && Object.keys(finalState.scope).length>0){
            this._createStateScope(finalState,finalState.scope)
        }

        finalState.createScope = (options:FlexStateOptions)=>this._createStateScope(finalState,options)

        // 7. 允许通过states.connected.on("enter",cb)形式订阅该状态的事件
        finalState.on=(event:string,cb:FlexStateTransitionHook)=>this.on(`${stateName}/${event}`,cb as Function)
        finalState.off=(event:string,cb:FlexStateTransitionHook)=>this.off(`${stateName}/${event}`,cb as Function) 
        

        this.states[stateName] = finalState        
        return this.states[stateName] 
    }


    /**
     * 为指定的状态创建一个子状态机
     * @param {*} state 
     * @param {*} settings 
     * @returns 
     */ 
    private _createStateScope(state:FlexState,options:FlexStateOptions) {        
        if(state.scope) throw new StateMachineError("子状态已经定义")
        // 创建子状态机
        state.scope = new FlexStateMachine({
            ...options, 
            scope : this,                           // 引用父状态机实例
            parent   : state,                       // 父状态            
            context  : this.context,
            autoStart: false                        // 当<父状态/done>时，即转换到父状态后，启动子状态机
        })       
        return state.scope
    }

    /**
     * 返回状态数据 
     *    states={ready:{name:"ready",value:1,title:"准备就绪"}}
     * 
     *    getState(1) == states.ready
     *    getState("ready") == states.ready
     *    getState(()=>"ready")== states.ready
     *    getState(()=>1)== states.ready
     *    getState({name:"ready",...}) =  states.ready
     * 
     * @param {*} param  状态名称 | 状态值 | 或返回状态名称或值的函数
     * @param {*} args   当param是一个函数时用来额外传递给函数的参数
     * @returns 状态   返回完整的数据{...}
     */
     getState(param: FlexStateArgs | Function | undefined,...args:Array<any>):FlexState {
        let resultState  
        resultState = typeof(param)==="function" ? (param as Function).call(this,...args) : param
        if(typeof(resultState)==="string" && (resultState in this.states)){
            return this.states[resultState]
        }else if(typeof(resultState)==="number"){
            for (let state of Object.values(this.states)) {
                if (state.value === resultState) return state
            }            
        }else if(isPlainObject(resultState) && (resultState.name in this.states)){
            return this.states[resultState.name]
        }       
        throw new InvalidStateError() 
    }
    /**
     * 增加状态
     * add({
     *      name:"",value:"",title: "",enter:()=>{},leave:()=>{},done:()=>{},next:[]
     * })
     * @param {*} state 
     */
    add(state:NewFlexState){
        let finalState = Object.assign({}, DefaultStateParams, state) as unknown as FlexState
        if(!finalState.name || !finalState.value) throw new StateMachineError("状态必须指定有效的name和value参数")
        if((finalState.name in this.states) || Object.values(this.states).findIndex(s=>s.value===finalState.value)!=-1) throw new StateMachineError(`状态<{${finalState.name}}>已经存在`)
        return this._add(finalState)
    }
    /**
     * 移除状态
     * @param {*} name 
     */
    remove(name:string) {
        if(name in this.states){    
            this.offAll(`${name}/enter`)
            this.offAll(`${name}/leave`)
            this.offAll(`${name}/done`)
            this.offAll(`${name}/resume`)            
            delete this.states[name]
        }
    }
    /**
     * 返回指定的状态是否是有效的状态
     * 
     * 状态必须定义在this.states中
     * 
     * @param {*} state  状态名称 | 状态值 | FlexState
     * @returns 
     */
    isValid(state:any):boolean {
        if(!state) return false
        if(typeof(state)==="string"){
            return state in this.states
        }else if(typeof(state)==="number"){
            return Object.values(this.states).some(s=>s.value===state)
        }else if(isPlainObject(state)){
            return Object.values(this.states).some(s=>(s.value===state.value) && (s.name===state.name))
        }else{
            return false
        }        
    }
    /**
     * 
     * 判断指定的状态是否与当前状态相匹配
     * 
     * fsm.current.name === "connect"
     * isCurrent("connect") == true
     * isCurrent({name:"connect",...}) == true
     * action.pending=()=>{}
     * isCurrent(action.pending) == true
     * 
     * @param {*} state 
     * @returns 
     */
    isCurrent(state:any):boolean {
        if (typeof (state) == "string") {
            return this.current.name === state
        } else if (isPlainObject(state)) {
            return state.name === this.current.name
        }else if(typeof(state)==="function"){
            return state() === this.current.name
        }else{            
            return false
        }
    }
    /**
     * 返回是否处理最终状态
     */
    isFinal(){
       return this.current && this.current.final
    }
    
    /**************************** 动作 *****************************/

    /**
     * 扫描当前context实例中所有被<@state>装饰的状态动作
     * @returns 
     */
    private _getDecoratoredActions(){       
        // decoratedActions={method1:[{参数}]}  
        let decoratedActions = getDecorators(this.context,"flexState") 
        Object.entries(decoratedActions).forEach(([methodName,[action]])=>{            
            (action as FlexStateAction).execute = this.context[methodName]
            decoratedActions[methodName] = action
        })
        return decoratedActions
    }
    /**
     * 注册动作
     * 扫描当前实例中所有被<@state>装饰的状态动作
     * 
     * @state({
     *   when         : [<>,<>],                //当前状态=when中的一个时才允许执行
     *   alias        : "<别名>",               // 当指定时，将使用来在context生成一个方法，否则会使用动作名称
     *   pending      : false,
     *   execute      : async ()=>{...},
     *   resolved     : "<可选的,执行成功后的状态>",
     *   rejected     : "<可选的,执行失败后的状态>",
     *   finally      : "<可选的,无论执行成功或失败后均转至的状态>",
     *   timeout      : <超时>,
     *   retryCount   : <重试次数>,
     *   retryInterval: <重试间隔>
     *   throttle     : <节流时间>
     *   debounce     : <去抖动>
     * })
     * 
     *  
     * 动作实质是要进入pending指定的状态，然后执行pending状态的enter方法
     *  如果执行成功或失败，则切换到不同的状态
     *  
     * 
     *
     */
    private _registerActions() {
        this.#actions       = {}        
        
        // 如果是子状态则不进行
        const staticActions:{[key:string]:FlexStateAction} = this.parent ? {} : getClassStaticValue(this.context, "actions")

        // 获取装饰器装饰的动作函数       
        // decoratedActions={method1:{参数}}
        let decoratedActions = this._getDecoratoredActions()
        // actions ={<动作名称>:{..动作参数...}}
        let actions = Object.assign({},decoratedActions,this.options.actions)
        for (let [name, action] of Object.entries(actions)) {
            try{
                if(Array.isArray(action)) action = action[0]
                if(!action.name) action.name = name
                this.register(action)
            }catch(e:any){
                console.error("注册异步状态机动作{}出错:{}",[name,e.message])
            }
        }
    }
    /**
     * 
     * 校验动作状态配置是否合理
     * 
       当指定了when时, 需要检查action.pending/resolved/rejected/finally参数是否与state配置冲突
          比如配置了when="Disconnected",但是配置了pending="Diconnecting",resolved="Disconnecting"，这些均属于无效配置
          应该对无效配置给出错误,但是由于when/pending/resolved/rejected/finally参数均支持函数
         因此，只有当这些参数是字符串时才可以进行注册时检查
        @param {*} action 
        @returns {Boolean} <true/false>
     */
    private _normalizeAction(action:FlexStateAction){
        const name = action.name
        // 1. 参数检查 
        if (typeof (action.execute) != "function") {
            throw new StateMachineError(`未定义状态动作函数${name}`)
        }
        if(name && (name in this.#actions)){
            throw new StateMachineError(`状态机动作${name}已存在,不能重复注册`)
        }  

        // 判断参数配置是否有效： 必须是有效的状态名称字符串或者函数
        ["pending","resolved","rejected","finally"].forEach(param =>{
            if(typeof(action[param]) == "string"){
                if(action[param] && !this.isValid(action[param])){
                    throw new StateMachineError(`动作参数${param}只能是有效的状态名称或者函数`)
                }
            }
        })  
        // when是一个数组[<状态>,<状态>,...]
        action.when = flexStringArrayArgument(action.when,this.context,this.current)              
        // 判断能否从when中其中一个状态切换到pending状态
        // 仅当pending是一个字符串时生进行校验，如果是一个函数，则只能在动作执行时进行校验
        if(typeof(action.pending)=="string" && Array.isArray(action.when) && action.when.length>0){ 
            // 如果pending在when中
            if(action.when.some(stateName=>stateName===action.pending)) return true            
            if(!action.when.some(stateName=>{
                const nextStates = this.getState(stateName).next                
                // 由于next参数可以是一个函数时，该函数仅在切换时被调用，因此在校验时只能先认为有效的
                return Array.isArray(nextStates) ? nextStates.includes(action.pending as string) : true
            })){
                throw new StateMachineError(`状态动作<${name}>的pending参数无效,无法从<{${action.when.join()}}>切换到<${action.pending}>`)
            }
        }

        // 判断能否切换到resolved/rejected/finally状态
        // - 如果指定了有效的pending，则判断能否从pending切换到resolved/rejected/finally状态
        // - 如果没有指定了有效的pending，则判断能否从when切换到resolved/rejected/finally状态
        let fromStates = (this.isValid(action.pending) && typeof(action.pending)!=="function") ? [action.pending] : action.when
        const endStates = ["resolved","rejected","finally"]
        endStates.forEach((param)=>{
            if(typeof(action[param])=="string"){             
                if(Array.isArray(fromStates) && !fromStates.some((stateName:string | undefined)=>{
                    const nextStates = this.getState(stateName).next                
                    return Array.isArray(nextStates) ? nextStates.includes(action[param]) : true
                })){
                    throw new StateMachineError(`状态动作<${name}>的<${param}>参数无效,无法从${fromStates.join()}切换到${action[param]}`)
                }
            }
        })

    }
    /**
     * 创建动作执行函数
     * @param action 
     * @returns 
     */
    private _createActionExecutor(action:FlexStateAction){
        return async function (this:any,...args:any[]) {       
            this._assertRunning()           
            if(this.isFinal()) throw new FinalStateError() 
            let result, oldStateName,finalState,pendingState,hasError:any = false,isPending=false
            try{
                oldStateName = this.current.name
                // 1. 判断动作执行的前置状态: 仅在当前状态==when指定的状态或者当前状态=null时才允许执行
                let whenState =flexStringArrayArgument(action.when,this.context,oldStateName)
                // 如果当前状态是NULL,则when参数不起作用。NULL状态可以转换至任意状态
                if(oldStateName!==NULL_STATE.name && whenState.length>0 &&  !whenState.includes(oldStateName)){
                    throw new TransitionError(`动作<${action.name}>只能在状态<${this.current.name}>下才允许执行,当前状态是<${whenState}>`)
                }                    
                // 2. 转换到pending状态: 如果指定了pending，则转换至该状态
                pendingState = flexStringArgument(action.pending,this.context,result)
                if(this.isValid(pendingState) && pendingState!==this.current.name){                    
                    await this.transition(pendingState , ...args)   
                    isPending = true                 
                }                
                // 3. 执行动作函数
                result = await action.execute.apply(this.context,args)                          
                // 4. 成功执行后的状态                    
                finalState = flexStringArgument(action.resolved,this.context,result)
                
            }catch(e){
                finalState = flexStringArgument(action.rejected,this.context,e)
                hasError = e   
                throw e
            }finally{
                // 如果执行成功：
                //  - 当指定了resolved和finally参数时，则转换此到resolved和finally状态
                //  - 如果没有指定resolved和finally参数,则会一直保持在pending参数指定的状态。
                //  - 如果pending参数也没有指定，则执行动作不会导致状态改变
                // 如果执行失败：
                //  - 当指定了rejected参数时，则转换此到rejected状态
                //  - 如果没有指定rejected参数，并且也指定了pending参数，则回退到pending之前的状态
                //  - 如果没有指定rejected参数，也没有指定了pending参数，保持当前状态不变
                // 如果指定了finally，则无论执行成功失败均切换至finally状态
                finalState = flexStringArgument(action.finally,this.context,hasError || result) || finalState
                if (this.isValid(finalState)) {
                    try{
                        // 切换到由resolved/rejected/finally三个参数决定的最终目标转换状态
                        await this.transition(finalState, result)                        
                    }catch(e){
                        // 如果切换失败，则代表了整个执行出错，应该进行状态复原
                        // 比如指定了resolved状态与当前状态是互悖的,就会导致动作执行成功，而无法转换到resolved状态
                        // 例：当前状态是Disconnected，action.pending="Connecting"，但是错误地配置了action.resolved="Disconnecting"
                        // 显然当执行Connect成功后应切换到Connected才是正确的，由于state.next已经约束了状态的切换
                        // 也就是说执行成功，但是配置参数出错导致不能切换到正确的状态
                        // 此种情况下有处理方法：
                        //   - 首先应该在register(action)进行参数检查，并给出错误提示，避免无效的参数配置。
                        //   - 但是如果action的resolved/rejected/finally三个参数是一个函数，则在注册时是无法检查参数的有效性的，直接切换必然后切换出错 
                        //      直接抛出错误: 此时动作已经执行成功，但是状态已经是错误的了。
                        //      由于再次重复执行动作可能是不可接受的，因为动作副作用可能已经产生                        
                        //      因此，调用者应该自行处理副作用                         
                        //      如果配置了启用自动错误状态，则状态机将切换到错误状态
                        await this._transitionToError({to:finalState.name,error:e})   
                    }                    
                }else{
                    // finalState是由resolved/rejected/finally三个参数决定的最终目标转换状态
                    // 如果finalState无效，则说明resolved/rejected/finally三个参数均没有提供或者配置无效
                    // 此时： 
                    //   - 如果曾经切换到pending状态并且执行出错，则需要恢复回退到原始状态
                    //   - 如果未指定有效的pending参数或者无法切换至pending状态，保持原始状态不变
                    if(isPending && hasError){
                        this.#currentState = this.getState(oldStateName)
                    }
                }
            }
            return result
        }
    }
    /**
     * 注册状态动作
     * 
     * action={
     *      when         : [],                                  //当前状态=when中的一个时才允许执行
     *      pending      : "<状态名>" || ()=>{},                // 执行前先切换到此状态
     *      execute      : ()=>{},                              // 动作执行函数
     *      resolved     : "<状态名>" || (result)=>{},          // 执行成功后的状态
     *      rejected     : "<状态名>" || (error)=>{},           // 执行失败后的状态
     *      finally      : "<状态名>" || (error,result)=>{},    // 无论成功或失败时的回调,也可以是一个状态，如果指定了此值,则resolved或rejected无效
     *      timeout      : 0                                    // 执行动作的超时时间,默认不限
     * }
     * 
     * register(name,action)
     * register(action)
     * 
     * @param {Object} action           动作参数
     */
     register(action:FlexStateAction) {
        this._normalizeAction(action)
        if(!action.name) throw new TypeError("需要为动作指定一个名称")
        // 包装动作函数
        const fn = this._createActionExecutor(action)
        this.#actions[action.name] = fn.bind(this.context)
        // 在实现中为该动作生成一个[action.name]的实例方法
        if(this.options.injectActionMethod) {
            // 如果类上存在与动作名称相同的方法时，需要为动作指定一个别名，否则会给出警告
            const actionName:string = (action.alias && action.alias.length>0) ? action.alias : action.name           
            if(actionName in this.context) {
                if(!this.#conflictMethods) this.#conflictMethods=[this.context[actionName]]  // 保存冲突方法的引用以备恢复
                this.#conflictMethods[actionName] = this.context[actionName]
                console.warn("异步状态机注入的动作在实例上已经存在同名方法")
            }          
            // 通过触发事件的方式来动作执行 
            this.context[actionName] = (...args:any[])=>{
                return new Promise((resolve, reject)=>{
                    // 为什么要使用setTimout来执行动作?
                    // 因为动作可能会在状态转换过程中被调用，使用setTimeout可以使动作执行从转换调用链中剥离
                    setTimeout(async ()=>{
                        try{                            
                            resolve(await this.execute(actionName,...args))
                        }catch(e){
                            if(this.options.throwActionError) reject(e)                            
                        }
                    },0)
                })
            }        
        } 
    }
    /**
     * 注销动作
     * @param {*} name  动作名称
     */
    unregister(name: string){
        if(name in this.#actions){            
            if(this.#conflictMethods && (name in this.#conflictMethods)){
                this[name] = this.#conflictMethods[name]
            }   
            delete this.#actions[name]         
            delete this.context[name]
        }
    }
    /**
     * 取消正在进行的状态转换
     */
    async cancel() {
        this.emit("transition/cancel")
    }
    /**
     * 强制转换状态机错误状态
     * @param {*} params 
     */
    private async _transitionToError(params:any){
        this.#currentState = this.states.ERROR
        await this._emitStateHookCallback(DoneStateEvent("ERROR"),params)
    }
    /**
     * 转换到指定状态
     * 
     * 支持以下调用方式:
     * - 指定状态名称
     * transition("connect",{a:1,b:2}) ==> onStateEnter(...{a:1,b:2})
     * - transition(<返回状态的函数>,...)
     * 
     * 如果next与current相同则直接返回
     *
     * @param {String} next   状态名称或函数，函数应该返回要切换到哪一个状态
     * @param {*} params      传递给状态回调的参数
     * 
     * @resturns  如果转换失败，则会触发错误
     */
    async transition(next:FlexStateArgs,params={}) {
        this._assertRunning()   
        // 如果正在转换中，则触发错误，不允许在转换状态中进行再次转换，这会导致状态混乱，因此触发错误
        if (this.transitioning) throw new TransitioningError()     
        // 如果状态已经处于最终状态,则不允许进行转换，除非重置状态机
        if(this.isFinal()) throw new FinalStateError()
        if(!this.isValid(next)) throw new InvalidStateError()
        
        this.#transitioning = true
        // 1. 处理参数,参数将被用来传递给状态响应回调
        const nextState = this.getState(next)           
        // 如果当前状态与要转换的目标状态一致，则静默返回
        if(this.current && nextState.name==this.current.name) return 

        let   isDone         = false                    // 转换成功标志
        const beginTime      = Date.now()
        const currentState   = this.current 
        const transitionInfo:FlexStateTransitionEventArguments = {
            params,
            from:currentState.name, 
            to: nextState.name
        }

        try{

            // 2. 判断是否允许从当前状态切换到下一个状态
            if (!this.canTransitionTo(nextState.name)) {
                this._safeEmitEvent(FlexStateTransitionEvents.CANCEL, {event:"CANCEL",...transitionInfo})
                throw new TransitionError(`不允许从状态<{${currentState.name}}>转换到状态<{${nextState.name}}>`)
            }

            // 2. 触发开始转换事件
            this._safeEmitEvent(FlexStateTransitionEvents.BEGIN, {event:"BEGIN",...transitionInfo})

            // 3. 进入next前，先离开当前状态： 当前状态可以通过触发Error来阻止状态切换
            if(currentState.name!=NULL_STATE.name){
                const leaveResult = await this._emitStateHookCallback(LeaveStateEvent(currentState.name) , { ...transitionInfo })
                if(leaveResult.error){     
                    this._safeEmitEvent(FlexStateTransitionEvents.ERROR, {error:leaveResult.error,...transitionInfo})
                    // 如果leave钩子抛出该错误，则说明
                    if(leaveResult.error instanceof SideEffectTransitionError){
                        await this._transitionToError({...transitionInfo,error:leaveResult.error})  // 转换到错误状态
                    }
                    throw leaveResult.error
                }
            }
          
            // 5. 触发下一个状态的enter回调
            const enterResult = await this._emitStateHookCallback(EnterStateEvent(nextState.name), {...transitionInfo})
            // 执行enter回调成功后
            if(enterResult.error){
                this._safeEmitEvent(FlexStateTransitionEvents.ERROR, {event:"ERROR",error:enterResult.error,...transitionInfo})
                if(enterResult.error instanceof SideEffectTransitionError){// 不可消除的副作用
                    await this._transitionToError({...transitionInfo,error:enterResult.error})  // 转换到错误状态
                }else{// 可消除的副作用
                    // 当无法进入nextState时，应该调用currentState的resume回调来恢复副作用
                    const resumeResult = await this._emitStateHookCallback(ResumeStateEvent(currentState.name), {...transitionInfo,error:enterResult.error})
                    // 如果无法恢复上下文，则应该转换到错误状态
                    if(resumeResult.error){
                        await this._transitionToError({...transitionInfo,error:resumeResult.error})  // 转换到错误状态
                    }
                }                
                throw enterResult.error
            }else{
                this.#currentState = this.states[nextState.name]
                isDone = true
            }                  
        }catch (e:any) {
            this._safeEmitEvent(FlexStateTransitionEvents.ERROR, {event:"ERROR",error:e,...transitionInfo})
            throw new TransitionError(e.message)
        }finally{
            this.#transitioning=false
        }
        // done事件不属于钩子事件，不能通过触发错误和返回false等方式中止转换过程
        if(isDone) {
            this._addHistory(this.current.name)
            this._safeEmitEvent(DoneStateEvent(this.current.name),transitionInfo)
            this._safeEmitEvent(FlexStateTransitionEvents.END, {event:"END",timeConsuming:Date.now()-beginTime,...transitionInfo})
            if(this.isFinal()) this._safeEmitEvent(FlexStateEvents.FINAL)
        }
        return this
    } 
    
    private _addHistory(stateName:string){
        if(this.options.history>0){
            this.history.push([Date.now(),stateName]) 
            if(this.history.length>this.options.history) this.history.splice(0,1)
        }
    }
    /**
     * 触发事件并忽略事件处理函数的错误
     */  
     private _safeEmitEvent(event:string, ...args:any[]){
        try{
            this.emit(event,...args)
        }catch(e){  }
    }
    /**
     * 执行状态回调
     * 触发事件
     * 
     * 由于状态事件可能注册了多个回调，因此this.emitAsync返回的是[result,result,]
     * 
     * 由于需要根据回调结果来进行后续的处理，因此需要一定的逻辑
     * 
     * - 只要有一个返回false，就代表拒绝进入下一个状态
     * - 只要有一个触发错误，就代表拒绝进入下一个状态
     * 
     * 
     * @param {*} event
     * @param {*} params 钩子参数
     * @returns
     */
    private async _emitStateHookCallback(event:string, params:any) {
        let eventResults,returnValue:Record<string,any> = {}
        try{
            // 触发onStateEnter等事件
            eventResults = await this.emitAsync(event, params)
            if (eventResults.some(r => r as any === false)) {
                returnValue = {error:new CancelledTransitionError()}
            } else {
                let errorIndex = eventResults.findIndex(r => r instanceof Error )
                if(errorIndex != -1) {
                    returnValue = {error:eventResults[errorIndex]}
                } 
            }
            returnValue.result = eventResults        
        }catch(e){
            returnValue = {error:e}
        }
        return returnValue
    }
    /**
     * 判断是否允许从fromState转换到toState
     * 
     * 如果当前状态为空null,则只能转换到Initial
     * 
     * canTransitionTo(to)          能否从当前状态转换到to状态
     * canTransitionTo(from,to)     能否从from状态转换到to状态
     * 
     * 如果from是一个数组，则只要其中一个状态允许转换即返回true
     * 
     * @param fromState    状态名称或状态值 
     * @param toState    状态名称或状态值
     */
     canTransitionTo(fromState:FlexStateArgs, toState?:FlexStateArgs):boolean 
     canTransitionTo(toState:FlexStateArgs):boolean
     canTransitionTo():boolean{
        let fromState:FlexState,toState:FlexState
        // 将fromState和toState转换为完整的状态{...}
        if (arguments.length === 1) {
            fromState = this.current
            toState = arguments[0]
        } else if (arguments.length === 2) {
            fromState = this.getState(arguments[0])
            toState = arguments[1]
        }else {
            throw new TypeError("Error Param")
        }

        // 目标状态
        toState = this.getState(toState)

        // 如果当前状态是NULL, 则只能转换到Initial状态
        if(fromState.name==NULL_STATE.name && toState.name!=this.initial.name){
            return false
        }
        // 如果已经是最终状态了，则不允许转换到任何状态
        if(fromState.final){
            return false
        }
        // next可以是一个函数，该函数(toState)
        if (fromState && fromState.next) {
            if(fromState.next==="*") return true
            let nextStates  = fromState.next  
            if(typeof (fromState.next) == "function") {
                nextStates = fromState.next.call(this)
            }
            nextStates = Array.isArray(nextStates) ? nextStates : (typeof(nextStates) == "string" ? [nextStates] : [])
            if(!nextStates.includes("ERROR")) nextStates.push("ERROR")            // 任何状态均可以转换至错误状态
            // 如果next中包括*符号代表可以切换到任意状态
            return ((nextStates.some(s=>s==="*")) || (nextStates.length === 1 && typeof(nextStates[0])=='string' && nextStates[0]==="ERROR") ? true : nextStates.includes(toState.name))
        } else {
            return true
        }
    }
    /**
     * 封装状态回调函数，使状态回调函数的执行支持：
     *
     *  1. 支持发送`${state.name}/cancel`事件取消执行
     * 
     * 
     *  2. 支持超时/重试/去抖动/节流
     *     可以在函数原型上定义timeout/retryCount/retryInterval/debounce/throttle参数
     *     const fn = () =>{...};
     *     fn.timeout = 0               // 指定超时 
     *     也可以指在状态中指定
     *     {
     *          connecting:{
     *             enter:async ()=>{...}
                   enter:[
                        async (result)=>{...},                        
                        timeout,                     // 超时参数
                   ],
                   enter:fn
     *          }   
     *     }
     *    
     *   则当回调执行enter函数时，可以通过this.emit("transition/cancel")来中止执行
     * 
     *  2. 支持超时控制
     * 
     *   也就是说如果执行超时，则代表失败，如当A->B时执行a.leave，如果执行a.leave超时，则代表失败
     *   同样，如进入b.enter执行超时也代表失败 
     * 
     * 
     */
    private _makeStateHookCallback(fn:FlexStateTransitionHookExt) {
        let [hookFn,runOptions] = Array.isArray(fn) ? fn : [fn,{timeout:0}];
        if(!runOptions.timeout) runOptions.timeout = 0                 
        let wrapperFn = timeoutWrapper(hookFn as any,{value:runOptions.timeout})
        return (args:FlexStateTransitionHookArguments) => new Promise(async (resolve, reject) => {
            // 取消操作
            const cancel = () => reject(new CancelledTransitionError())       
            // 订阅取消事件
            this.once(FlexStateTransitionEvents.CANCEL, cancel)
            let callCount = 1,retryInterval=0,hasError
            // 供调用
            args.retry = (ms=0) =>{retryInterval=ms;callCount++;throw new Error()}
            args.retryCount = 0
            while(callCount>0){
                callCount--      
                try{
                    let result = await wrapperFn.call(this.context, args)  
                    resolve(result)
                }catch(e){
                    hasError = e
                }finally{
                    args.retryCount++
                }
                if(callCount>0 && retryInterval>0) await delay(retryInterval)
            }                
            this.off(FlexStateTransitionEvents.CANCEL, cancel)  // 正常结束时，就应清除上面侦听once的cancel回调，也就是说不需要再侦听取消操作了            
            if(hasError) reject(hasError)
        })
    } 
    /**
     * 通过触发事件执行指定的动作
     * 
     * .execute("<动作名称>",...args)
     * 
     * 一般会调用直接调用实例方法来执行动作
     *  如 tcp.connect(....)
     
     *
     * @param {*} name 动作名称
     * @param args
     */
    async execute(name: string, ...args:any[]) {     
        this._assertRunning()   
        return await this.#actions[name].call(this,...args)
    }

    private _assertRunning(){
        if(!this.#running) throw new NotRunningError()
    }
    /**
     * 等待状态机进入指定状态
     * 
     * @param {*} state   状态名称或状态值
     */
    async waitForState(state:FlexStateArgs){
        const forState = this.getState(state)
        if(this.current.name===forState.name || this.current.value===forState.value) return 
        return await this.wait(`${forState.name}/done`)        
    }
    /**
     * 等待进入初始状态
     * @returns 
     */
    async waitForInitial(){
        return this.waitForState(this.initial)
    } 
}


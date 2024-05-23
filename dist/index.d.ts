import * as flex_decorators from 'flex-decorators';
import { DecoratorOptions } from 'flex-decorators';
import { FlexEventOptions, FlexEvent } from 'flex-tools';

/**
 *   工具函数
 
 */

/**
 *
 * 处理字符串参数
 *
 * 该参数可以是一个字符串或者返回字符串的函数
 *
 * 当参数是一个函数时执行该函数的结果
 *
 * flexStringArgument("a")   == "a"
 * flexStringArgument(()=>"a")   == "a"
 * flexStringArgument(()=>"a",context)   == "a"  为函数传入this
 * flexStringArgument((a,b)=>`${a}a${b}`,context,1,2)   == "1a2"  为函数传入this和参数
 *
 * @param {*} param
 */
declare function flexStringArgument(param: any, ...args: any[]): any;
declare function flexStringArrayArgument(param: any, ...args: any[]): any;

interface FlexStateDecoratorOptions extends DecoratorOptions, Pick<FlexStateAction, 'name' | 'alias' | 'when' | 'pending' | 'resolved' | 'rejected' | 'finally'> {
    [key: string]: any;
}
declare const flexState: flex_decorators.LiteDecoratorCreator<FlexStateDecoratorOptions, any, never>;
declare const state: flex_decorators.LiteDecoratorCreator<FlexStateDecoratorOptions, any, never>;

declare class StateMachineError extends Error {
}
declare class NotRunningError extends StateMachineError {
}
declare class InvalidStateError extends StateMachineError {
}
declare class FinalStateError extends StateMachineError {
}
declare class TransitionError extends StateMachineError {
}
declare class TransitioningError extends TransitionError {
}
declare class CancelledTransitionError extends TransitionError {
}
declare class ResumeTransitionError extends TransitionError {
}
declare class SideEffectTransitionError extends TransitionError {
}

type FlexStateActionCallback = 'pending' | 'resolved' | 'rejected' | 'finally';
/**
 *
 * 状态动作
*/
interface FlexStateAction {
    name?: string;
    alias?: string;
    injectMethod?: boolean;
    when?: string | Array<string> | ((params: Object, current: FlexState) => Array<string>);
    pending?: string | Function;
    resolved?: string | Function;
    rejected?: string | Function;
    finally?: string | ((params: Object) => Array<string>);
    execute(...args: any[]): void;
    [key: string]: any;
}
type FlexStateActionMap = Record<string, FlexStateAction>;
/**
 * 状态动作装饰器参数
 */
type FlexStateActionDecoratorOptions = Omit<FlexStateAction, "name" | "execute">;
interface FlexStateTransitionEventArguments {
    event?: 'CANCEL' | 'BEGIN' | 'END' | 'ERROR';
    from: string;
    to: string;
    error?: Error;
    params?: any;
    [key: string]: any;
}
type FlexStateTransitionHookArguments = Exclude<FlexStateTransitionEventArguments, 'event'> & {
    retryCount: number;
    retry: Function | ((interval?: number) => void);
};
/**
 * 状态转换钩子函数签名
 */
type FlexStateTransitionHook = ((args: FlexStateTransitionHookArguments) => Awaited<Promise<any>> | void) | undefined;
type FlexStateTransitionHookExt = FlexStateTransitionHook | [FlexStateTransitionHook, {
    timeout: number;
}];
type FlexStateNext = string | Array<string> | (() => Array<string>);
interface NewFlexState {
    name?: string;
    value: number | null;
    alias?: string | undefined;
    title?: string;
    initial?: boolean;
    final?: boolean;
    enter?: FlexStateTransitionHookExt;
    leave?: FlexStateTransitionHookExt;
    done?: FlexStateTransitionHookExt;
    resume?: FlexStateTransitionHookExt;
    next?: FlexStateNext;
    [key: string]: any;
}
/**
 * 状态声明
 */
type FlexState = Required<NewFlexState>;
type FlexStateArgs = string | number | FlexState;
type FlexStateMap = Record<string, NewFlexState>;
type IDLE_STATE_TYPE = Pick<FlexState, 'name' | 'value' | 'next'>;
type ERROR_STATE_TYPE = Pick<FlexState, 'name' | 'value' | 'next' | 'final'>;
/**
 * 状态机事件
 */
declare enum FlexStateEvents {
    START = "start",
    STOP = "stop",
    FINAL = "final",// 当状态机进入FINAL
    ERROR = "error"
}
declare enum FlexStateTransitionEvents {
    BEGIN = "transition/begin",// 开始转换前
    END = "transition/end",// 转换结束后
    CANCEL = "transition/cancel",// 转换被取消：不允许转换时
    ERROR = "transition/error",// 转换出错，主要状态回调事件执行出错
    FINAL = "transition/final"
}
/**
 * 状态机转换钩子回调
 */
interface FlexStateTransitionHooks {
    onTransition?(params: FlexStateTransitionEventArguments): void;
    onTransition?(params: FlexStateTransitionEventArguments): Awaited<Promise<any>>;
    onTransitionBegin?(params: FlexStateTransitionEventArguments): Awaited<Promise<any>>;
    onTransitionEnd?(params: FlexStateTransitionEventArguments): Awaited<Promise<any>>;
    onTransitionError?(params: FlexStateTransitionEventArguments): Awaited<Promise<any>>;
    onTransitionCancel?(params: FlexStateTransitionEventArguments): Awaited<Promise<any>>;
}
type TransitionHookTypes = keyof FlexStateTransitionHooks;
interface FlexStateMachineContext extends FlexStateTransitionHooks {
    [key: string]: any;
}
/**
 * 状态机构造参数
 */
interface FlexStateOptions extends FlexStateTransitionHooks, FlexEventOptions {
    name?: string;
    states?: FlexStateMap;
    parent?: FlexState;
    context?: any;
    autoStart?: boolean;
    actions?: FlexStateActionMap;
    injectActionMethod?: boolean;
    throwActionError?: boolean;
    injectStateValue?: boolean;
    history?: number;
    scope?: FlexStateMachine;
}
declare class FlexStateMachine extends FlexEvent {
    #private;
    static states: FlexStateMap;
    static actions: FlexStateActionMap;
    states: Record<string, FlexState>;
    [key: string]: any;
    constructor(options?: FlexStateOptions);
    /**************************** 公开属性 *****************************/
    get name(): string;
    get context(): any;
    get parent(): Required<NewFlexState>;
    get scope(): FlexStateMachine;
    get running(): boolean;
    get actions(): {
        [name: string]: Function;
    };
    get CURRENT(): number | null;
    get current(): Required<NewFlexState>;
    get initial(): Required<NewFlexState>;
    get transitioning(): boolean;
    get history(): [number, string][];
    get options(): Required<FlexStateOptions> & FlexEventOptions;
    /**************************** 初始化 *****************************/
    private _addParentStateListener;
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
    private _addStates;
    /**************************** 状态机管理 *****************************/
    /**
     * 触发状态机事件
     * @param {*} event
     */
    private _emitStateMachineEvent;
    /**
     * 开始运行状态机
     * 即转换到初始状态
     * 如果当前状态不为空，则直接返回
     */
    start(): Promise<this | undefined>;
    private _stop;
    /**
     * 停止状态机运行
     */
    stop(): Promise<void>;
    /**
     * 重置状态机
     *
     * 重置操作：
     *  - 取消正在进行的状态切换事件回调
     *  - 当前状态置为IDLE_STATE
     *
     */
    reset(): Promise<void>;
    /**************************** 状态管理 *****************************/
    /**
     *   注册切换侦听器

    *  - 在配置中传入
     *  - 类中定义
     * onTransitionBegin,onTransitionEnd,onTransitionCancel,onTransitionError回调
     *  -
     */
    private _addTransitionListeners;
    /**
     * 规范化状态数据
     * @param {*} state
     * @returns
     */
    private _normalizeState;
    /**
     * 增加状态
     * @param state
     * @returns
     */
    private _add;
    /**
     * 为指定的状态创建一个子状态机
     * @param {*} state
     * @param {*} settings
     * @returns
     */
    private _createStateScope;
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
    getState(param: FlexStateArgs | Function | undefined, ...args: Array<any>): FlexState;
    /**
     * 增加状态
     * add({
     *      name:"",value:"",title: "",enter:()=>{},leave:()=>{},done:()=>{},next:[]
     * })
     * @param {*} state
     */
    add(state: NewFlexState): Required<NewFlexState>;
    /**
     * 移除状态
     * @param {*} name
     */
    remove(name: string): void;
    /**
     * 返回指定的状态是否是有效的状态
     *
     * 状态必须定义在this.states中
     *
     * @param {*} state  状态名称 | 状态值 | FlexState
     * @returns
     */
    isValid(state: any): boolean;
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
    isCurrent(state: any): boolean;
    /**
     * 返回是否处理最终状态
     */
    isFinal(): boolean;
    /**************************** 动作 *****************************/
    /**
     * 扫描当前context实例中所有被<@state>装饰的状态动作
     * @returns
     */
    private _getDecoratoredActions;
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
    private _registerActions;
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
    private _normalizeAction;
    /**
     * 创建动作执行函数
     * @param action
     * @returns
     */
    private _createActionExecutor;
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
    register(action: FlexStateAction): void;
    /**
     * 注销动作
     * @param {*} name  动作名称
     */
    unregister(name: string): void;
    /**
     * 取消正在进行的状态转换
     */
    cancel(): Promise<void>;
    /**
     * 强制转换状态机错误状态
     * @param {*} params
     */
    private _transitionToError;
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
    transition(next: FlexStateArgs, params?: any): Promise<this | undefined>;
    private _addHistory;
    /**
     * 触发事件并忽略事件处理函数的错误
     */
    private _safeEmitEvent;
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
    private _emitStateHookCallback;
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
    canTransitionTo(fromState: FlexStateArgs, toState?: FlexStateArgs): boolean;
    canTransitionTo(toState: FlexStateArgs): boolean;
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
    private _makeStateHookCallback;
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
    execute(name: string, ...args: any[]): Promise<any>;
    private _assertRunning;
    /**
     * 等待状态机进入指定状态
     *
     * @param {*} state   状态名称或状态值
     */
    waitForState(state: FlexStateArgs): Promise<any[] | undefined>;
    /**
     * 等待进入初始状态
     * @returns
     */
    waitForInitial(): Promise<any[] | undefined>;
}

declare const IDLE_STATE: IDLE_STATE_TYPE;
declare const ERROR_STATE: ERROR_STATE_TYPE;
/**
 * 默认状态值
 */
declare const DefaultStateParams: {
    name: string;
    alias: undefined;
    value: number;
    title: string;
    initial: boolean;
    final: boolean;
    next: never[];
    enter: undefined;
    done: undefined;
    leave: undefined;
    resume: undefined;
};

export { CancelledTransitionError, DefaultStateParams, ERROR_STATE, ERROR_STATE_TYPE, FinalStateError, FlexState, FlexStateAction, FlexStateActionCallback, FlexStateActionDecoratorOptions, FlexStateActionMap, FlexStateArgs, FlexStateDecoratorOptions, FlexStateEvents, FlexStateMachine, FlexStateMachineContext, FlexStateMap, FlexStateNext, FlexStateOptions, FlexStateTransitionEventArguments, FlexStateTransitionEvents, FlexStateTransitionHook, FlexStateTransitionHookArguments, FlexStateTransitionHookExt, FlexStateTransitionHooks, IDLE_STATE, IDLE_STATE_TYPE, InvalidStateError, NewFlexState, NotRunningError, ResumeTransitionError, SideEffectTransitionError, StateMachineError, TransitionError, TransitionHookTypes, TransitioningError, flexState, flexStringArgument, flexStringArrayArgument, state };

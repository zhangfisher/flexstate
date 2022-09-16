import "reflect-metadata";
import { nanoid }  from "nanoid" 


function getOwnMetadata(metadataKey: string, constructor: Object, propertyKey?: string | symbol): any {
    const constructors = [ constructor, ...getSuperClasses(constructor) ];
    let result: any[] = [];
    for (let index = 0; index < constructors.length; index++) {
        const c = constructors[constructors.length - index - 1];
        let metadata: any[];
        if (propertyKey) {
            metadata = Reflect.getOwnMetadata(metadataKey, c, propertyKey);
        } else {
            metadata = Reflect.getOwnMetadata(metadataKey, c);
        }

        if (metadata) {
            if (Array.isArray(metadata)) {
                result = [ ...result, ...metadata ];
            } else {
                return [ metadata ];
            }
        }
    }
    return result;
}


export function getSuperClasses(constructor: any): any[] {
    const constructors = [];
    let current = constructor;
    while (Object.getPrototypeOf(current)) {
        current = Object.getPrototypeOf(current);
        constructors.push(current);
    }
    return constructors;
}

/**
 * 获取指定对象的所有包含原型链上的所有属性列表 * 
 * @param obj 
 * @returns 
 */
export function getPropertyNames(obj: any) {
    const propertyNames: string[] = [];
    do {
        propertyNames.push(...Object.getOwnPropertyNames(obj));
        obj = Object.getPrototypeOf(obj);
    } while (obj);
    // get unique property names
    return Array.from(new Set<string>(propertyNames));
}

/**
 * 获取指定装饰器的方法
 * 
 * getDecorators(<实例>,"装饰器名称")
 * 
 * @param decorator   装饰器名称 
 * @returns 
 */
function getDecorators(instance: any,decorator:string):{}  {
    let results:Record<string,any> = {} ;
    let propertyNames = getPropertyNames(instance)
    propertyNames.forEach(propertyName =>{
        let metadatas = getOwnMetadata(`decorator:${decorator}`,instance,propertyName)
        if(metadatas && metadatas.length>0){
            if(!(propertyName in results)) {
                results[propertyName] = []
            }         
            results[propertyName].push(...metadatas)
        }
    })
    return results;
} 
/**
 *
 * 状态动作
*/
export interface FlexStateAction{
    name          :string,             //指定唯一的动作名称
    alias?        : string,  									// 动作别名，当在实例中注入同名的方法时，如果指定别名，则使用该别名
    timeout?      : number,                                     // 执行动作的超时时间
    retryCount?   : number,                   				    // 指定动作执行失败时的重试次数
    retryInterval?: number                    				    // 指定动作执行失败时的重试间隔
    debounce?     : number,                                     // 防抖动
    throttle?     : number                                      // 节流
    // 指定该动作仅在当前状态是when中的一个时才允许执行动作
    when?         : Array<string>,       		                
    pending?      : string | Function,                			// 开始执行动作前切换到pending状态
    resolved?     : string | Function,                			// 执行成功后切换到resolved状态
    rejected?     : string | Function,                			// 执行失败后切换到rejected状态
    finally?      : string | ((params:Object)=>Array<string>)   // 无论执行成功或失败均切换到finally状态
    execute(params:Object):void       // 动作执行函数，具体干活的
    [key:string]:any
} 
// 动作列表{[name]:<FlexState>}
export type FlexStateActionMap= Record<string,FlexStateAction>

/**
 * 状态动作装饰器参数
 */
export type FlexStateActionDecoratorOptions = Omit<FlexStateAction,"name" | "execute">
 
const FLEXSTATE_ACTIONS_METADATA = "flexstate:actions"
const FLEXSTATE_ACTION_METADATA = "flexstate:action"


/**
 * 创建一个通用装饰器
   
 * 
 */


/**
 * 函数包装器
 * 用来对原始方法进行包装并返回包装后的方法
 */
interface DecoratorMethodWrapper<T> {
    (method:Function,options:T | Function):Function;
    (method:Function, options:T | Function, target: Object, propertyKey: string | symbol,descriptor:TypedPropertyDescriptor<any>):Function
};


interface DecoratorBaseOptions {
    id?: string;
}

type DecoratorCreator<T> =  (options?:T & DecoratorBaseOptions)=>MethodDecorator 


interface createMethodDecoratorOptions<T>{
    wrapper?:DecoratorMethodWrapper<T>
    proxyOptions?:boolean         // 提供配置代理对象，实现从当前实例从动态读取配置参数，当启用时，可以在当前实例getDecoratorOptions(options)
    singleton?:boolean           // 指定方法上是否只能一个该装饰器,如果重复使用则会出错
}


interface IDecoratorAccessor{
    getDecoratorOptions(options:{} & DecoratorBaseOptions,methodName:string | symbol,decoratorName:string):{}
}

/**
 * 为装饰器参数创建一个访问代理，用来从当前实例中读取装饰器参数
 * @param options 
 * @returns 
 */
function createMethodDecoratorOptionsProxy<T>(options:T,methodName:string | symbol,decoratorName:string):Function{
    return function(instance:Object){
        return new Proxy(options as any,{
            get(target: object, propKey: string, receiver: any){
                if("getDecoratorOptions" in instance){ 
                    return (instance as IDecoratorAccessor)['getDecoratorOptions'].call(instance,options as any,methodName,decoratorName)
                }
                return Reflect.get(target, propKey, receiver);
            }
        })
    }
}

/**
 * 
 * 创建装饰器
 * 
 * createMethodDecorator<参数类型>(<id>,<默认参数>,{
 *      wrapper:DecoratorMethodWrapper          // 对目标函数进行包装
 *      proxyOptions:true,                      // 创建一个代理用来访问实例的getDecoratorOptions()方法,如果需要动态读取装饰器参数时有用
 *      singleton:false,
 *      inherit:false,                          // 是否继承父类中id相同的装饰器
 * })
 * 
 * 
 */
 export function createMethodDecorator<T extends DecoratorBaseOptions>(name:string,defaultOptions?:T,opts?:createMethodDecoratorOptions<T>): DecoratorCreator<T>{
    type DecoratorOptionsType = T & DecoratorBaseOptions
    return (options?:DecoratorOptionsType):MethodDecorator=>{
        return function(this:any,target: Object, propertyKey: string | symbol,descriptor:PropertyDescriptor):PropertyDescriptor{ 
            

            // 1. 生成默认的装饰器参数
            let finalOptions:DecoratorOptionsType = Object.assign({},defaultOptions || {},options)
            if(!finalOptions.id) finalOptions.id = nanoid()
            let getOptions
            // 2. 创建代理从当前实现读取装饰器参数
            if(opts?.proxyOptions){
                getOptions = createMethodDecoratorOptionsProxy<DecoratorOptionsType>(finalOptions,propertyKey,name)                
            }

            // 3. 定义元数据, 如果多个装饰器元数据会合并后放在数组中
            let metadataKey = `decorator:${name}`
            let oldMetadata:(Function | DecoratorOptionsType)[] = Reflect.getMetadata(metadataKey, target as any,propertyKey);
            if(!oldMetadata) oldMetadata= []
            // 是否只允许使用一个装饰器
            if(oldMetadata.length>0 && opts?.singleton){
                throw new Error(`Only one decorator<${name}> can be used on the get method<${<string>propertyKey}>`)
            }
            oldMetadata.push(getOptions || finalOptions)
            Reflect.defineMetadata(metadataKey, oldMetadata,target as any,propertyKey);

            // 对被装饰方法函数进行包装
            if(typeof opts?.wrapper=="function"){
                descriptor.value = opts.wrapper(descriptor.value,getOptions || finalOptions,target,propertyKey,descriptor)   
            }
            return descriptor            
        };    
    }    
}   


function logWrapper(method:Function,getOptions:any){
    return function(this:any,info:string){
        let options = getOptions(this)
        console.log("before")
        method.call(this,`${options.prefix}${info}`)
        console.log("after")
    }
}
interface LogOptionsType extends DecoratorBaseOptions{
    prefix?:string
}

const log = createMethodDecorator<LogOptionsType>("interval",{prefix:'[LOG]-'},{wrapper:logWrapper,proxyOptions:true})

interface TimeoutOptionsType extends DecoratorBaseOptions{
    timeout?:number 
}
const timeout = createMethodDecorator<TimeoutOptionsType>("timeout",{timeout:5},{proxyOptions:true})



 

class A{
    constructor(name:string){
    }
    test1(){
        console.log("test")
    }
    test2(){
        console.log("test")
    }
}


class AA extends A{
    test3(){
        console.log("test-aa")
    }
}

class AAA extends AA{
    test4(){
        console.log("test-aaa")
    }
}


let a1 = new A("a1")
let aa1 = new AA("aa1")
let aaa1 = new AAA("aaa1")


// console.log(JSON.stringify(Reflect.getMetadata(FLEXSTATE_ACTIONS_METADATA,a1)))
// console.log(JSON.stringify(Reflect.getMetadata(FLEXSTATE_ACTIONS_METADATA,aa1)))


class MyClass implements IDecoratorAccessor{
    private timeoutOptions:{[key:string | symbol]:any} = {t1:{timeout:10}}
    constructor(){
        let timeouts = getDecorators(this,"timeout")
        console.log("timeouts=",JSON.stringify(timeouts))
    } 
    getDecoratorOptions(options: DecoratorBaseOptions, methodName: string | symbol, decoratorName: string): {} {
        if(options.id=='t1'){
            (options as TimeoutOptionsType).timeout = 100
        }
        return options
    }

    @timeout({id:"t1",timeout:1})
    @timeout({id:"t2",timeout:2})
    @log()
    test(){

    } 
    @log()
    @timeout({timeout:3})
    pr2(text:string){
        console.log(text)
    }
}



 
let c1 = new MyClass()
c1.pr2("hello pr")
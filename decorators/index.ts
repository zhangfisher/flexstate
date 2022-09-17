
import "reflect-metadata";
import { getPropertyNames,getOwnMetadata }  from "./utils"


interface DecoratorOptions {
    name?: string | symbol;
    [key: string]: any;
}

/**
 * 用来对装饰函数进行包装
 */ 
type creatorReturnType = MethodDecorator | TypedPropertyDescriptor<any> 
type DecoratorCreateOptions<T> =  (options:T & DecoratorOptions)=>MethodDecorator

interface DecoratorMethodWrapper {
    (method:Function):any;
    (method:Function ,target: Object, propertyKey: string | symbol,descriptor:TypedPropertyDescriptor<any>):any
};

/**
 * 创建通用的状态机,具有以下特性：
 * 
 *  - 装饰器方法具有一个decorator:<装饰器名称>的元数据标识
 *  - 装饰器参数默认有一个name参数，如果不指定则使用方法名称
 *  - 通过getDecorators(instance,"<装饰器名称>")可以获取当前实现的所有被装饰的方法列表
 * 
 *  createMethodDecorator<参数类型,方法参数类型>(<装饰器名称,作为元数据标识>,{默认参数},<包装器>)
 *  
 * const log = createMethodDecorator<{type:number}>("log",{type:"file"})
 * const log = createMethodDecorator<{type:number}>("log",{type:"file"},(method:any) => {
 *      return function(){
 *           
 *      }
 * })
 * 
 */

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



 


/**
 * 获取指定装饰器的方法
 * 
 * getDecorators(<实例>,"装饰器名称")
 * 
 * @param decorator   装饰器名称 
 * @returns 
 */
 function getDecorators(instance: any,decorator:string): string[] {
    let results: string[] = [];
    let propertyNames = getPropertyNames(instance)
    propertyNames.forEach(propertyName =>{
        let r = getOwnMetadata(`decorator:${decorator}`,instance,propertyName)
        results.push(...r)
    })
    return results;
} 
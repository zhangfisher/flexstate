
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
export function createMethodDecorator<T>(name:string,defaultParams?:{},wrapper?:DecoratorMethodWrapper):DecoratorCreateOptions<T> 
export function createMethodDecorator<T,M>(name:string,defaultParams?:{},wrapper?:DecoratorMethodWrapper):DecoratorCreateOptions<T> {
    return (options:DecoratorCreateOptions<T>):MethodDecorator=>{
        return (target: Object, propertyKey: string | symbol,descriptor:TypedPropertyDescriptor<any>):TypedPropertyDescriptor<any>{ 
            let metadataKey = `decorator:${name}`
            let options = target as (T & DecoratorOptions)
            let finalParams = Object.assign({},defaultParams || {},options)
            if(!finalParams.name) finalParams.name = propertyKey
            Reflect.defineMetadata(metadataKey, finalParams,target as any,propertyKey || '');
            return descriptor
        }
       
    }
    
    return func 
}
 


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
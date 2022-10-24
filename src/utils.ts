/**
 *   工具函数
 
 */


import "reflect-metadata";

/**
 *  延时指定的时间
 * @param t 
 * @returns 
 */
export async function delay(t:number = 100):Promise<void> {
    return new Promise((resolve)=>{
        setTimeout(resolve,t)
    })
}
// /**
//  *  延时指定的时间，当超时后会抛出TIMEOUT错误
//  * @param t 
//  * @returns 
//  */
// export function delayRejected(t:number = 100):Promise<Error>{
//     return new Promise((resolve, reject) => {
//         setTimeout(() =>{
//             reject("TIMEOUT")
//         },t);
//     })
// }

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
 export function flexStringArgument(param:any,...args:any[]){
    let result = param
    if(typeof(param)==="function"){
        result= param.call(...args) 
    }
    if(typeof(result)!="string"){
        return result ? String(result) : result
    }
    return result
}

 /*  
*    通用字符串数组参数，当需要接收一个字符串数组作为参数时使用

*   flexStringArray支持更加灵活的参数定义。
*  - 当param是一个函数，则会自动执行其返回值
*  - 当param不是数组时，会扩展为数组
*  - 当param是字符串时，使用,进行拆分为数组
* 
* flexStringArrayArgument("xxx")  ==  ["xxx"]
* flexStringArrayArgument()  ==  []
* flexStringArrayArgument(["a","b"])  ==  ["a","b"]

  当param是一个函数时
  fn= ()=>"x"
* flexStringArrayArgument(fn)  ==  ["x"]
  // 可以为函数传入this及参数
  flexStringArrayArgument(fn,this,1)  == fn.call(this,1)=== ["x"]  

* flexStringArrayArgument(["a",()=>"x"])  ==  ["a","x"]

  // 如果是一个使用,分割的字符串，则自动转成字符串
* flexStringArrayArgument("a,b") == ["a","b"]
* 
* @param {*} param 
*/
export function flexStringArrayArgument(param:any,...args:any[]){
    let results = typeof(param)==="function"  ? param.call(...args)  : param
    results = Array.isArray(results) ? results : (results ? (typeof(results)==="string" ? results.split(",") : [results]) : [] ) 
    return results.map((result:any)=>typeof(result)==="function" ? result.call(...args) : (typeof(result)=="string" ? result :String(result)))
}

/**
 * 处理对象参数
 * 1. 当参数是函数时执行并返回结果值
 * 2. 当param不是Object时，如果指定个默认参数，由视
 * 
 * flexObjectArgument(1,{value:100,count:1},"value")  == {value:100,count:1}
 * flexObjectArgument({x:1,y:1},{value:100,count:1})  == {x:100,y:1,value:100,count:1}
 * 
 * 
 * @param {*} param 
 * @param  {...any} args 
 */
// export function flexObjectArgument(param:any,defaultValue:Object={},defaultKey:string){    
//     let results:{[ prop:string]:any } = {},params  = param 
//     if(typeof(params)==="function") params = params.call() 
//     if(typeof(params)==="object"){
//         if(defaultKey) results[defaultKey]= params
//     }else{
//         results = params
//     }     
//     return Object.assign({},defaultValue,results)
// }

// 判断对象是否是一个类
export function isClass(cls:any):boolean{
    let result = false
    if (typeof(cls) === 'function' && cls.prototype) {
        try {
            cls.arguments && cls.caller;
        } catch(e) {
            result=true
        }
    }
    return result;
}

/**
 * 返回是否原始{}
 * @param obj
 * @returns {boolean}
 */
 export function isPlainObject(obj:any):boolean{
    if (typeof obj !== 'object' || obj === null) return false;
    var proto = Object.getPrototypeOf(obj);
    if (proto === null) return true;
    var baseProto = proto;

    while (Object.getPrototypeOf(baseProto) !== null) {
        baseProto = Object.getPrototypeOf(baseProto);
    }
    return proto === baseProto; 
}
/**
 *
 * 获取继承链上指定字段的值
 * 获取类的静态变量值，会沿继承链向上查找，并能自动合并数组和{}值
 *
 * calss A{
 *     static settings={a:1}
 * }
 * calss A1 extends A{
 *     static settings={b:2}
 * }
 *
 * getStaticFieldValue(new A1(),"settings") ==== {a:1,b:2}
 *
 * @param instanceOrClass
 * @param fieldName
 * @param options
 */
export function getClassStaticValue(instanceOrClass:object,fieldName:string,options:{merge?: number,default?:any}={}){
    const opts = Object.assign({
        // 是否进行合并,0-代表不合并，也就是不会从原型链中读取，1-使用Object.assign合并,2-使用mergeDeepRigth合并
        // 对数组,0-不合并，1-合并数组,   2-合并且删除重复项
        merge:2,
        default:null                   // 提供默认值，如果{}和[]，会使用上述的合并策略
    },options)

    let proto = isClass(instanceOrClass) ? instanceOrClass : instanceOrClass.constructor
    let fieldValue = (proto as any)[fieldName]
    // 0-{}, 1-[], 2-其他类型
    let valueType = isPlainObject(fieldValue) ? 0 : (Array.isArray(fieldValue) ? 1 : 2)
    // 如果不是数组或者{}，则不需要在继承链上进行合并
    if(opts.merge===0 || valueType===2){
        return fieldValue
    }

    const defaultValue = valueType===0 ? Object.assign({},opts.default || {}) : (opts.default || [])

    let valueList = [fieldValue]

    // 依次读取继承链上的所有同名的字段值
    while (proto){
        proto = (proto as any).__proto__
        if((proto as any)[fieldName]){
            valueList.push((proto as any)[fieldName])
        }else{
            break
        }
    }
    // 进行合并
    let mergedResults = fieldValue
    if(valueType===0){// Object
        mergedResults =  valueList.reduce((result,item)=>{
            if(isPlainObject(item)){        // 只能合并字典
                return opts.merge ===1 ? Object.assign({},defaultValue,item,result) : Object.assign({},defaultValue,item,result)
            }else{
                return result
            }
        },{})
    }else{  // 数组
        mergedResults =  valueList.reduce((result,item)=>{
            if(Array.isArray(item)){ // 只能合并数组
                result.push(...item)
            }
            return result
        },[])
    }
    // 删除数组中的重复项
    if(Array.isArray(mergedResults) && opts.merge===2){
        mergedResults = Array.from(new Set(mergedResults))
        // 如果提供defaultValue并且数组成员是一个{},则进行合并
        if(isPlainObject(defaultValue)){
            mergedResults.forEach((value:any,index:number) =>{
                if(isPlainObject(value)){
                    mergedResults[index] =  Object.assign({},defaultValue,value)
                }
            })
        }
    }
    return mergedResults
}
 

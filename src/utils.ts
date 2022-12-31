/**
 *   工具函数
 
 */


import "reflect-metadata";
 
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

 
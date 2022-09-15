


/**
 * 允许类型成员中的某些字段可以通过索引进行访问
 * 
 * 例：
 *  
 * interface Dog{
 *    age:number
 *    name:string
 * }
 * let tom:Dog ={ age:20, name:'tom'}
 * 此时如果tom['age']会提示不可索引
 * 
 * 
 * 
 * 
 * 
 */


 export interface FlexStateAction{
    pending?      : string | Function,                			// 开始执行动作前切换到pending状态
    resolved?     : string | Function,                			// 执行成功后切换到resolved状态
    rejected?     : string | Function,                			// 执行失败后切换到rejected状态
    finally?      : string | ((params:Object)=>Array<string>)   // 无论执行成功或失败均切换到finally状态
} 

let action:FlexStateAction = {
    pending:"", resolved:"", rejected:"",finally:"ddd"
}

['pending', 'resolved', 'rejected', 'finally'].forEach(key => {
   if(key in action) console.log(action[key])
})







export type FlexStateActionCallback = 'pending' | 'resolved' | 'rejected' | 'finally' 


export type Indexable<T,U extends string | number | symbol > = T | {    
    [key in FlexStateActionCallback]: any 
} 

interface State{ 
    pending     : number                                     // 防抖动
    resolved     : number                                      // 节流    
    fff?:number,
}

type myState = Indexable<State,FlexStateActionCallback>

let f = new Array<FlexStateActionCallback>('pending','resolved' , 'rejected' , 'finally' )


let d:myState = {
    pending:1,
    resolved:2
}

let k:FlexStateActionCallback ="pending"
console.log(d.resolved,d["fff"])



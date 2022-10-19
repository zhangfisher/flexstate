


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



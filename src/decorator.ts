/**
 * 
 * @state()装饰器，用来为类方法提供状态转换指示
 * 
 * 
 */

import { createDecorator,DecoratorOptions } from "flex-decorators"

export interface FlexStateAction extends DecoratorOptions{
    pending?      : string | Function,                			// 开始执行动作前切换到pending状态
    resolved?     : string | Function,                			// 执行成功后切换到resolved状态
    rejected?     : string | Function,                			// 执行失败后切换到rejected状态
    finally?      : string | ((params:Object)=>Array<string>)   // 无论执行成功或失败均切换到finally状态
} 
export interface FlexStateAction{

}

export const action = createDecorator<FlexStateAction>("action",{})
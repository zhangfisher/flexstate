/**
 * 
 * @state()装饰器，用来为类方法提供状态转换指示
 * 
 * 
 */

import { createLiteDecorator, DecoratorOptions} from "flex-decorators"
import { FlexStateAction } from "."

export interface FlexStateDecoratorOptions extends DecoratorOptions,Pick<FlexStateAction,'name' | 'alias' | 'when' | 'pending' | 'resolved' | 'rejected' | 'finally'>{
    [key:string]:any
}  

export const flexState = createLiteDecorator<FlexStateDecoratorOptions>("flexState")

export const state = flexState
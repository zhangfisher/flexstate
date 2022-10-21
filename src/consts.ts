import type { NULL_STATE_TYPE,ERROR_STATE_TYPE} from "./flexstate"

// 状态机未初始化时的特殊状态值
export const NULL_STATE: NULL_STATE_TYPE = { name: 'NULL', value: null, next: "*" }
// 出错状态
export const ERROR_STATE:ERROR_STATE_TYPE = { name: "ERROR", final: true, value: Number.MAX_SAFE_INTEGER, next: "*" }

/**
 * 默认状态值
 */
export const DefaultStateParams = {
    name   : "",                                    // 状态名称
    alias  : undefined,                             // 状态别名 
    value  : 0,                                     // 状态值，一般是数值>,
    title  : "",                                    // 状态标题，一般用于显示
    initial: false,                                 // 是否是初始化状态 
    final  : false,                                 // 最终状态
    next   : [],                                    // 定义该状态的下一个状态只能是哪些状态
    enter  : undefined,
    done   : undefined,
    leave  : undefined,
    resume : undefined
}

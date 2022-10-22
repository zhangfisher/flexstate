# 关于

`有限状态机`是一种数学计算模型，它描述了在任何给定时间只能处于一种状态的系统的行为。形式上，有限状态机有五个部分：
● 初始状态值 (`initial state`)
● 有限的一组状态 (`states`)
● 有限的一组事件 (`events`)
● 由事件驱动的一组状态转移关系 (`transitions`)
● 有限的一组最终状态 (`final states`)

状态是指由状态机建模的系统中某种`有限的`、`定性的`“模式”或“状态”，并不描述与该系统相关的所有（可能是无限的）数据。例如，水可以处于以下 4 种状态中的一种：冰、液体、气体或等离子体。然而，水的温度可以变化，所以其测量值是定量的和无限的。再比如管理`TCP Socket`连接时，其生命周期内存在明显的有限状态转换。

目前开源的有限状态机实现中比较知名的有：

- `xstate`：堪称状态机航空母舰、功能太强大了，也太复杂了，学习成本非常高。
- `Javascript State Machine`：功能较弱，在实际试用过程中发现在进行异步切换时存在问题。
- `jssm`：特点是引入自己的DSL语法来描述状态机，使用起来比较别扭。


事实上，从功能完整度上看`xstate`是第一选择，但是其过于复杂了，在功能与易用平衡方面并不理想。

因此，我开发了`FlexState`有限状态机，力求在**功能性、易用性上达到平衡**。


**`FlexState`是一款有限状态机，具有以下特性：**

1. 基于`Class`构建有限状态机实例 
2. 支持状态`enter/leave/resume/done`钩子事件 
3. 状态切换完全支持异步操作
4. 支持定义异步状态动作`Action` 
5. 支持状态切换生命周期事件订阅 
6. 支持错误处理和状态切换中止 
7. 基于`TypeScript`开发
8. 支持子状态


> **开源推荐：** 

- **`VoerkaI18n`**: [基于Nodejs/React/Vue的一键国际化解决方案](https://zhangfisher.github.io/voerka-i18n/)
- **`Logsets`**: [命令行应用增强输出库](https://zhangfisher.github.io/logsets/)
- **`AutoPub`**:  [基于pnpm/monorepo的自动发包工具](https://zhangfisher.github.io/autppub/)
- **`FlexDecorators`**:  [JavaScript/TypeScript装饰器开发](https://zhangfisher.github.io/flex-decorators/)
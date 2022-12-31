import { defineConfig } from 'tsup'

export default defineConfig({
    entry: ["src/index.ts"],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake:true, 
    banner: {
        js: `/**
*        
*   ---=== FlexState ===---
*   https://zhangfisher.github.com/flexstate
* 
*   简单易用的有限状态机实现
*
*/`}
}) 
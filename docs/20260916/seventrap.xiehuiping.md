## 项目规范调整

- 修改【docs/readme.md】中的文件命名规范，多人协作时，使用序号会存在重复
- 增加代码格式化skills

## javascript代码规范

- 在AGENTS.md文件中增加对javascript开发的规范约束
  - 在所有业务函数前增加当前函数的业务逻辑注释，可以是简短的一句话，也可以是代码详细的功能描述，可以根据函数的复杂程度决定注释的内容细腻度
  - 在所有功能函数前增加当前函数的功能说明注释，按照JSDoc规范撰写

    - 包含如下内容

    ```javascript
    /**
     * @description Recursively lists all files in a directory, skipping certain directories.
     * @param {string} directory - The root directory to start listing files from.
     * @returns {Promise<string[]>} A promise that resolves to an array of file paths.
     * */
    ```

- 增加对函数的命名约束，相关函数的定义需要完整的语义话表达，不能是：load、submit、save等

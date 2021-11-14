module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    // ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
    ecmaFeatures: {
      // jsx: true, // 启用 JSX
      // 'globalReturn': true, // 允许在全局作用域下使用 return 语句
      impliedStrict: true, // 启用全局 strict mode (如果 ecmaVersion 是 5 或更高)
    },
  },
  env: {
    node: true,
    es6: true,
    browser: false,
  },
  /**
   * 内置
   * eslint:xxx
   *
   * 导入配置
   * 可省略前缀 eslint-config-
   *
   * 导入插件
   * 插件：module.exports.configs.xxx
   * 可省略前缀 eslint-plugin-
   * plugin:packageName/configName
   *
   * 使用配置文件
   * 相对路径、绝对路径
   */
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    // 'prettier/@typescript-eslint', // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
    // 'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    // 0: off, 1: warn, 2: error
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    semi: 'warn',
    quotes: ['warn', 'single'],
    'spaced-comment': 'warn', // 注释空格
    'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 0 }],
    'no-trailing-spaces': 'warn', // 行尾随空格
    'space-before-blocks': ['warn', 'always'],
    'no-whitespace-before-property': 'warn', // 属性空格
    'no-multi-spaces': 'warn', // 去除多余空格
    'comma-dangle': ['warn', 'always-multiline'], // 尾逗号
    'comma-spacing': ['warn', { before: false, after: true }], // 逗号后的空格
    'array-bracket-spacing': ['warn', 'never'], // 数组前后空格
    // 强制在大括号中使用一致的空格
    'object-curly-spacing': [
      'warn',
      'always',
      {
        objectsInObjects: false,
      },
    ],
    // 强制要求在对象字面量的属性中键和值之间使用一致的间距
    'key-spacing': [
      'warn',
      {
        beforeColon: false,
        afterColon: true,
      },
    ],
    // 强制箭头函数前后使用一致的空格
    'arrow-spacing': [
      'warn',
      {
        before: true,
        after: true,
      },
    ],
    'computed-property-spacing': ['warn', 'never'], // 下标的前后空格
    'func-call-spacing': ['warn', 'never'], // 函数调用名和括号间的空格
    // 关键词前后的空格
    'keyword-spacing': [
      'warn',
      {
        before: true,
        overrides: {
          if: { after: false },
          for: { after: false },
          while: { after: false },
          switch: { after: false },
          catch: { after: false },
        },
      },
    ],
    'quote-props': ['warn', 'as-needed'], // 属性名引号
    'multiline-ternary': ['warn', 'always-multiline'], // 多行三元表达式
    'brace-style': ['warn', '1tbs', { allowSingleLine: true }], // 大括号风格
    'block-spacing': ['warn', 'always'], // 代码块前后空格
    'eol-last': ['warn', 'always'], // 文件末尾空行
    '@typescript-eslint/indent': ['warn', 2, { SwitchCase: 1 }], // 缩进
    // indent: ['warn', 2, { SwitchCase: 1 }], // 缩进
    'object-property-newline': ['warn', { allowAllPropertiesOnSameLine: true }], // 强制将对象的属性放在不同的行上
    'space-in-parens': ['warn', 'never'], // 禁止或强制圆括号内前后的空格
    'space-infix-ops': 'warn', // 操作符周围空格
    'semi-style': ['warn', 'last'], // 分号位置
    'space-unary-ops': ['warn'], // 一元操作符前后空格
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // 'vue/max-attributes-per-line': ['warn', {
    //   singleline: {
    //     max: 4,
    //     allowFirstLine: true,
    //   },
    //   multiline: {
    //     max: 1,
    //     allowFirstLine: false,
    //   },
    // }],
  },
};

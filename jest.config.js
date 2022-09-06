/*
 * @Author: liaihong 
 * @Date: 2022-09-06 11:14:49
 * @LastEditors: liaihong 
 * @LastEditTime: 2022-09-06 11:15:42
 * @FilePath: /feeds-js-sdk-new/jest.config.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // 是否显示覆盖率报告
  collectCoverage: true,
  // 让jest明白哪些文件需要通过测试，这里的要求是：src文件夹下的所有.ts文件都需要覆盖到
  collectCoverageFrom: ['src/*.ts'],
  // 这里的意思是：语句覆盖率、分支覆盖率、函数覆盖率、行覆盖率这四项，都得为100%才能通过测试。
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  // 路径映射配置，官文档网地址：https://kulshekhar.github.io/ts-jest/docs/getting-started/paths-mapping
  // 这里的配置要和 TypeScript 路径映射相对应
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@docs/(.*)$': '<rootDir>/docs/$1',
    '^@public/(.*)$': '<rootDir>/public/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },
};
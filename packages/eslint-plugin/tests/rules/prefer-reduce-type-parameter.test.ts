import { RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/prefer-reduce-type-parameter';
import { getFixturesRootDir } from '../RuleTester';

const rootPath = getFixturesRootDir();

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: rootPath,
      project: './tsconfig.json',
    },
  },
});

ruleTester.run('prefer-reduce-type-parameter', rule, {
  valid: [
    `
      new (class Mine {
        reduce() {}
      })().reduce(() => {}, 1 as any);
    `,
    `
      class Mine {
        reduce() {}
      }

      new Mine().reduce(() => {}, 1 as any);
    `,
    `
      import { Reducable } from './class';

      new Reducable().reduce(() => {}, 1 as any);
    `,
    "[1, 2, 3]['reduce']((sum, num) => sum + num, 0);",
    '[1, 2, 3][null]((sum, num) => sum + num, 0);',
    '[1, 2, 3]?.[null]((sum, num) => sum + num, 0);',
    '[1, 2, 3].reduce((sum, num) => sum + num, 0);',
    '[1, 2, 3].reduce<number[]>((a, s) => a.concat(s * 2), []);',
    '[1, 2, 3]?.reduce<number[]>((a, s) => a.concat(s * 2), []);',
    `
      declare const tuple: [number, number, number];
      tuple.reduce<number[]>((a, s) => a.concat(s * 2), []);
    `,
    `
      type Reducer = { reduce: (callback: (arg: any) => any, arg: any) => any };
      declare const tuple: [number, number, number] | Reducer;
      tuple.reduce(a => {
        return a.concat(1);
      }, [] as number[]);
    `,
    `
      type Reducer = { reduce: (callback: (arg: any) => any, arg: any) => any };
      declare const arrayOrReducer: number[] & Reducer;
      arrayOrReducer.reduce(a => {
        return a.concat(1);
      }, [] as number[]);
    `,
  ],
  invalid: [
    {
      code: `
declare const arr: string[];
arr.reduce<string>(acc => acc, arr.shift() as string);
      `,
      output: `
declare const arr: string[];
arr.reduce<string>(acc => acc, arr.shift());
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 32,
          line: 3,
        },
      ],
    },
    {
      code: '[1, 2, 3].reduce((a, s) => a.concat(s * 2), [] as number[]);',
      output: '[1, 2, 3].reduce<number[]>((a, s) => a.concat(s * 2), []);',
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 45,
          line: 1,
        },
      ],
    },
    {
      code: '[1, 2, 3].reduce((a, s) => a.concat(s * 2), <number[]>[]);',
      output: '[1, 2, 3].reduce<number[]>((a, s) => a.concat(s * 2), []);',
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 45,
          line: 1,
        },
      ],
    },
    {
      code: '[1, 2, 3]?.reduce((a, s) => a.concat(s * 2), [] as number[]);',
      output: '[1, 2, 3]?.reduce<number[]>((a, s) => a.concat(s * 2), []);',
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 46,
          line: 1,
        },
      ],
    },
    {
      code: '[1, 2, 3]?.reduce((a, s) => a.concat(s * 2), <number[]>[]);',
      output: '[1, 2, 3]?.reduce<number[]>((a, s) => a.concat(s * 2), []);',
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 46,
          line: 1,
        },
      ],
    },
    {
      code: `
const names = ['a', 'b', 'c'];

names.reduce(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {} as Record<string, boolean>,
);
      `,
      output: `
const names = ['a', 'b', 'c'];

names.reduce<Record<string, boolean>>(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {},
);
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 3,
          line: 9,
        },
      ],
    },
    {
      code: `
['a', 'b'].reduce(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  <Record<string, boolean>>{},
);
      `,
      output: `
['a', 'b'].reduce<Record<string, boolean>>(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {},
);
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 3,
          line: 7,
        },
      ],
    },
    {
      code: `
['a', 'b']['reduce'](
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {} as Record<string, boolean>,
);
      `,
      output: `
['a', 'b']['reduce']<Record<string, boolean>>(
  (accum, name) => ({
    ...accum,
    [name]: true,
  }),
  {},
);
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 3,
          line: 7,
        },
      ],
    },
    {
      code: `
function f<T, U extends T[]>(a: U) {
  return a.reduce(() => {}, {} as Record<string, boolean>);
}
      `,
      output: `
function f<T, U extends T[]>(a: U) {
  return a.reduce<Record<string, boolean>>(() => {}, {});
}
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 29,
          line: 3,
        },
      ],
    },
    {
      code: `
declare const tuple: [number, number, number];
tuple.reduce((a, s) => a.concat(s * 2), [] as number[]);
      `,
      output: `
declare const tuple: [number, number, number];
tuple.reduce<number[]>((a, s) => a.concat(s * 2), []);
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 41,
          line: 3,
        },
      ],
    },
    {
      code: `
declare const tupleOrArray: [number, number, number] | number[];
tupleOrArray.reduce((a, s) => a.concat(s * 2), [] as number[]);
      `,
      output: `
declare const tupleOrArray: [number, number, number] | number[];
tupleOrArray.reduce<number[]>((a, s) => a.concat(s * 2), []);
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 48,
          line: 3,
        },
      ],
    },
    {
      code: `
declare const tuple: [number, number, number] & number[];
tuple.reduce((a, s) => a.concat(s * 2), [] as number[]);
      `,
      output: `
declare const tuple: [number, number, number] & number[];
tuple.reduce<number[]>((a, s) => a.concat(s * 2), []);
      `,
      errors: [
        {
          messageId: 'preferTypeParameter',
          column: 41,
          line: 3,
        },
      ],
    },
  ],
});

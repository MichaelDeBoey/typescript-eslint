import { noFormat, RuleTester } from '@typescript-eslint/rule-tester';

import rule from '../../src/rules/no-non-null-assertion';

const ruleTester = new RuleTester();

ruleTester.run('no-non-null-assertion', rule, {
  valid: [
    //
    'x;',
    'x.y;',
    'x.y.z;',
    'x?.y.z;',
    'x?.y?.z;',
    '!x;',
  ],
  invalid: [
    {
      code: 'x!;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: undefined,
        },
      ],
    },
    {
      code: 'x!.y;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x?.y;',
            },
          ],
        },
      ],
    },
    {
      code: 'x.y!;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: undefined,
        },
      ],
    },
    {
      code: '!x!.y;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 2,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: '!x?.y;',
            },
          ],
        },
      ],
    },
    {
      code: 'x!.y?.z;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x?.y?.z;',
            },
          ],
        },
      ],
    },
    {
      code: 'x![y];',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x?.[y];',
            },
          ],
        },
      ],
    },
    {
      code: 'x![y]?.z;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x?.[y]?.z;',
            },
          ],
        },
      ],
    },
    {
      code: 'x.y.z!();',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x.y.z?.();',
            },
          ],
        },
      ],
    },
    {
      code: 'x.y?.z!();',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x.y?.z?.();',
            },
          ],
        },
      ],
    },
    // some weirder cases that are stupid but valid
    {
      code: 'x!!!;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 5,
          suggestions: undefined,
        },
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 4,
          suggestions: undefined,
        },
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 3,
          suggestions: undefined,
        },
      ],
    },
    {
      code: 'x!!.y;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 4,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x!?.y;',
            },
          ],
        },
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 3,
          suggestions: undefined,
        },
      ],
    },
    {
      code: 'x.y!!;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 6,
          suggestions: undefined,
        },
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 5,
          suggestions: undefined,
        },
      ],
    },
    {
      code: 'x.y.z!!();',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 8,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x.y.z!?.();',
            },
          ],
        },
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          endColumn: 7,
          suggestions: undefined,
        },
      ],
    },
    {
      code: 'x!?.[y].z;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x?.[y].z;',
            },
          ],
        },
      ],
    },
    {
      code: 'x!?.y.z;',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x?.y.z;',
            },
          ],
        },
      ],
    },
    {
      code: 'x.y.z!?.();',
      errors: [
        {
          messageId: 'noNonNull',
          line: 1,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: 'x.y.z?.();',
            },
          ],
        },
      ],
    },
    {
      code: noFormat`
x!
.y
      `,
      errors: [
        {
          messageId: 'noNonNull',
          line: 2,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: `
x
?.y
      `,
            },
          ],
        },
      ],
    },
    {
      code: noFormat`
x!
// comment
.y
      `,
      errors: [
        {
          messageId: 'noNonNull',
          line: 2,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: `
x
// comment
?.y
      `,
            },
          ],
        },
      ],
    },
    {
      code: noFormat`
x!
 // comment
    . /* comment */
      y
      `,
      errors: [
        {
          messageId: 'noNonNull',
          line: 2,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: `
x
 // comment
    ?. /* comment */
      y
      `,
            },
          ],
        },
      ],
    },
    {
      code: noFormat`
x!
 // comment
     /* comment */ ['y']
      `,
      errors: [
        {
          messageId: 'noNonNull',
          line: 2,
          column: 1,
          suggestions: [
            {
              messageId: 'suggestOptionalChain',
              output: `
x?.
 // comment
     /* comment */ ['y']
      `,
            },
          ],
        },
      ],
    },
  ],
});

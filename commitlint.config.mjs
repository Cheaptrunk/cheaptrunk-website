export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // tipi standard + "content" per post, progetti e testi del sito
    'type-enum': [2, 'always', [
      'build', 'chore', 'ci', 'content', 'docs', 'feat',
      'fix', 'perf', 'refactor', 'revert', 'style', 'test',
    ]],
  },
};
// Só a suíte deste checkout: os worktrees dos agentes (.claude/worktrees/) ficam dentro da pasta do projeto e trariam
// os testes de outras branches para o `npm test` e o `npm run check` (issue #24).
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '.claude/worktrees/**'],
  },
});

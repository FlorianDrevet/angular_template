import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Rule } from '@angular-devkit/schematics';

const templateRoot = join(__dirname, '../base/files/base');

const additions = [
  { source: 'AGENTS.md', target: '/AGENTS.md' },
  { source: '.agents/skills/angular-feature/SKILL.md', target: '/.agents/skills/angular-feature/SKILL.md' },
];

export default function addAiCodingGuidance(): Rule {
  return (tree) => {
    for (const { source, target } of additions) {
      if (!tree.exists(target)) {
        tree.create(target, readFileSync(join(templateRoot, source), 'utf8'));
      }
    }

    return tree;
  };
}

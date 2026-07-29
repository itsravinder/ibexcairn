import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * A skill is a Markdown instruction sheet with YAML frontmatter (name,
 * description) telling an agent how to perform one migration task for one source
 * platform. Ported from the upstream fork (MIT, (c) Microsoft - see skills/NOTICE.md).
 * They are prompt assets, not code, so they carry over unchanged (ADR-0001).
 */
export interface Skill {
  readonly category: string;
  readonly platform: string;
  readonly name: string;
  readonly description: string;
  readonly body: string;
  readonly path: string;
}

interface Frontmatter {
  readonly fields: Readonly<Record<string, string>>;
  readonly body: string;
}

/** Split `---`-fenced frontmatter from the Markdown body. CRLF-tolerant. */
function splitFrontmatter(rawInput: string): Frontmatter {
  const raw = rawInput.replace(/\r\n/g, '\n');
  if (!raw.startsWith('---\n')) return { fields: {}, body: raw.trim() };
  const close = raw.indexOf('\n---', 4);
  if (close === -1) return { fields: {}, body: raw.trim() };

  const block = raw.slice(4, close);
  const body = raw.slice(close + 4).replace(/^\n+/, '');
  const fields: Record<string, string> = {};
  const lines = block.split('\n');

  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? '';
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) {
      i += 1;
      continue;
    }
    const key = match[1] ?? '';
    const inline = match[2] ?? '';
    if (inline === '>' || inline === '>-' || inline === '|' || inline === '|-') {
      // Folded/literal scalar: consume the following blank or indented lines.
      const collected: string[] = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i] ?? '';
        if (next.trim() !== '' && !/^\s/.test(next)) break;
        collected.push(next.trim());
        i += 1;
      }
      fields[key] = collected.join(' ').trim();
    } else {
      fields[key] = inline.trim();
      i += 1;
    }
  }
  return { fields, body: body.trim() };
}

/** Parse one SKILL.md into a Skill, given its category and platform. */
export function parseSkill(
  raw: string,
  category: string,
  platform: string,
  path: string,
): Skill {
  const { fields, body } = splitFrontmatter(raw);
  return {
    category,
    platform,
    name: fields['name'] ?? category,
    description: fields['description'] ?? '',
    body,
    path,
  };
}

const DEFAULT_SKILLS_DIR = join(__dirname, '..', 'skills');

/** Loads skills from disk. Layout: <skillsDir>/<category>/<platform>/SKILL.md */
export class SkillLoader {
  constructor(private readonly skillsDir: string = DEFAULT_SKILLS_DIR) {}

  /** All skills found on disk. */
  list(): Skill[] {
    const skills: Skill[] = [];
    for (const category of this.dirs(this.skillsDir)) {
      const categoryDir = join(this.skillsDir, category);
      for (const platform of this.dirs(categoryDir)) {
        const path = join(categoryDir, platform, 'SKILL.md');
        try {
          const raw = readFileSync(path, 'utf8');
          skills.push(parseSkill(raw, category, platform, path));
        } catch {
          // no SKILL.md for this platform under this category - skip
        }
      }
    }
    return skills;
  }

  /** One skill, or throw naming what was asked for. */
  get(category: string, platform: string): Skill {
    const path = join(this.skillsDir, category, platform, 'SKILL.md');
    let raw: string;
    try {
      raw = readFileSync(path, 'utf8');
    } catch {
      throw new Error(`No skill '${category}' for platform '${platform}' at ${path}`);
    }
    return parseSkill(raw, category, platform, path);
  }

  private dirs(parent: string): string[] {
    try {
      return readdirSync(parent).filter((e) => statSync(join(parent, e)).isDirectory());
    } catch {
      return [];
    }
  }
}

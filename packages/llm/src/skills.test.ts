import { describe, it, expect } from 'vitest';
import { SkillLoader, parseSkill } from './index';

describe('parseSkill', () => {
  it('parses inline frontmatter and body', () => {
    const skill = parseSkill(
      '---\nname: demo\ndescription: A one-line description.\n---\n# Heading\n\nBody text.',
      'cat',
      'biztalk',
      '/x',
    );
    expect(skill.name).toBe('demo');
    expect(skill.description).toBe('A one-line description.');
    expect(skill.body).toContain('# Heading');
    expect(skill.body).toContain('Body text.');
  });

  it('parses a folded (>-) description spanning multiple lines', () => {
    const skill = parseSkill(
      '---\nname: folded\ndescription: >-\n  Component mapping for a\n  platform to Azure.\n---\nBody.',
      'source-to-logic-apps-mapping',
      'biztalk',
      '/y',
    );
    expect(skill.name).toBe('folded');
    expect(skill.description).toBe('Component mapping for a platform to Azure.');
  });

  it('is tolerant of CRLF line endings', () => {
    const skill = parseSkill('---\r\nname: crlf\r\ndescription: ok\r\n---\r\nBody', 'c', 'p', '/z');
    expect(skill.name).toBe('crlf');
    expect(skill.description).toBe('ok');
  });
});

describe('SkillLoader (committed BizTalk skills)', () => {
  it('loads all 13 BizTalk skills with name, description and body', () => {
    const skills = new SkillLoader().list().filter((s) => s.platform === 'biztalk');
    expect(skills).toHaveLength(13);
    for (const skill of skills) {
      expect(skill.name, skill.category).not.toBe('');
      expect(skill.description.length, skill.category).toBeGreaterThan(0);
      expect(skill.body.length, skill.category).toBeGreaterThan(0);
    }
  });

  it('fetches a specific skill by category and platform', () => {
    const skill = new SkillLoader().get('source-to-logic-apps-mapping', 'biztalk');
    expect(skill.category).toBe('source-to-logic-apps-mapping');
    expect(skill.body.length).toBeGreaterThan(0);
  });

  it('throws, naming the request, for a missing skill', () => {
    expect(() => new SkillLoader().get('no-such-skill', 'biztalk')).toThrow(/no-such-skill/);
  });
});

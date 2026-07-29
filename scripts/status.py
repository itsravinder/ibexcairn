#!/usr/bin/env python3
"""Stage status from STAGES.csv.

Usage:
  python scripts/status.py         print status to the terminal
  python scripts/status.py --md    (re)generate CHECKLIST.md from STAGES.csv
"""
import csv
import os
import sys
from collections import Counter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rows = list(csv.DictReader(open(os.path.join(ROOT, 'STAGES.csv'), encoding='utf-8')))
by = {r['stage_id']: r for r in rows}
dep = {r['stage_id']: [x.strip() for x in r['depends_on'].split(',') if x.strip()] for r in rows}

# integrity checks - a tracker that lies is worse than no tracker
missing = sorted({d for k in dep for d in dep[k]} - set(by))
if missing:
    raise SystemExit(f'STAGES.csv references unknown stages: {missing}')

_seen = set()


def _cycle(node, stack):
    if node in stack:
        return stack[stack.index(node):] + [node]
    if node in _seen:
        return None
    for d in dep.get(node, []):
        found = _cycle(d, stack + [node])
        if found:
            return found
    _seen.add(node)
    return None


for stage in dep:
    cyc = _cycle(stage, [])
    if cyc:
        raise SystemExit(f'STAGES.csv has a dependency cycle: {" -> ".join(cyc)}')

MARK = {'done': '[x]', 'in_progress': '[~]', 'blocked': '[!]', 'dropped': '[-]'}
PHASES = ['Foundation', 'Assessment', 'Conversion', 'MuleSoft', 'SaaS', 'Expansion']
GATES = {'S17': 'G1', 'S24': 'G2', 'S35': 'G3', 'S37': 'G4'}

ready_ids = sorted(
    r['stage_id']
    for r in rows
    if r['status'] == 'todo' and not [d for d in dep[r['stage_id']] if by[d]['status'] != 'done']
)


def write_checklist() -> None:
    """Generate CHECKLIST.md from STAGES.csv so it never drifts from the tracker."""
    done = sum(1 for r in rows if r['status'] == 'done')
    nxt = ready_ids[0] if ready_ids else None
    lines = [
        '# Ibex Cairn - build checklist',
        '',
        f'**{done} / {len(rows)} stages complete.** '
        'Generated from [STAGES.csv](STAGES.csv) by `python scripts/status.py --md` - '
        'do not edit by hand.',
        '',
        'Legend: `[x]` done &middot; `[~]` in progress &middot; `[ ]` todo. '
        'Gates are human sign-off points.',
        '',
    ]
    for phase in PHASES:
        rs = sorted((r for r in rows if r['phase'] == phase), key=lambda x: x['stage_id'])
        n_done = sum(1 for r in rs if r['status'] == 'done')
        lines.append(f'## {phase} ({n_done}/{len(rs)})')
        lines.append('')
        for r in rs:
            box = MARK.get(r['status'], '[ ]')
            gate = f' _(gate {GATES[r["stage_id"]]})_' if r['stage_id'] in GATES else ''
            nextp = ' &larr; next' if r['stage_id'] == nxt else ''
            lines.append(f"- {box} {r['stage_id']} {r['name']}{gate}{nextp}")
        lines.append('')
    out = os.path.join(ROOT, 'CHECKLIST.md')
    with open(out, 'w', encoding='utf-8', newline='\n') as fh:
        fh.write('\n'.join(lines))
    print(f'Wrote {out} ({done}/{len(rows)} done)')


if '--md' in sys.argv:
    write_checklist()
    raise SystemExit(0)

counts = Counter(r['status'] for r in rows)
print(f"Ibex Cairn - {counts.get('done', 0)}/{len(rows)} stages complete")
print('   ' + '  '.join(f'{k}={v}' for k, v in sorted(counts.items())))
print()

for phase in PHASES:
    rs = sorted((r for r in rows if r['phase'] == phase), key=lambda x: x['stage_id'])
    n_done = sum(1 for r in rs if r['status'] == 'done')
    print(f'{phase}  ({n_done}/{len(rs)})')
    for r in rs:
        sid = r['stage_id']
        blockers = [d for d in dep[sid] if by[d]['status'] != 'done']
        if r['status'] == 'done':
            note = f"  {r['commit'] or 'no commit recorded'}"
        elif not blockers:
            note = '  <- READY'
        else:
            note = '  <- waits on ' + ','.join(blockers)
        print(f"  {MARK.get(r['status'], '[ ]')} {sid}  {r['name'][:38]:<38} {r['priority']}{note}")
    print()

print('Startable now: ' + (', '.join(ready_ids) if ready_ids else 'none'))

unverified = sorted(r['stage_id'] for r in rows if r['status'] == 'done' and r['verified'] != 'yes')
if unverified:
    print('Marked done but NOT verified: ' + ', '.join(unverified))

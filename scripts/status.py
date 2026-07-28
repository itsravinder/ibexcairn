#!/usr/bin/env python3
"""Print stage status from STAGES.csv: what is done, what is startable, what blocks the rest.

Usage:  python scripts/status.py
"""
import csv
import os
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

ready = sorted(r['stage_id'] for r in rows
               if r['status'] == 'todo'
               and not [d for d in dep[r['stage_id']] if by[d]['status'] != 'done'])
print('Startable now: ' + (', '.join(ready) if ready else 'none'))

unverified = sorted(r['stage_id'] for r in rows if r['status'] == 'done' and r['verified'] != 'yes')
if unverified:
    print('Marked done but NOT verified: ' + ', '.join(unverified))

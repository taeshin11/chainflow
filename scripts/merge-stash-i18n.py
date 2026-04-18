#!/usr/bin/env python3
"""
Merge prior-stash i18n additions (nav.heatmap/screener/short + supply.*)
into current HEAD message files (which already have nav.insider + insider.*).

Run AFTER checkout of messages/ to clean HEAD, BEFORE dropping stash.
"""
import json, os, subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

MESSAGES_DIR = os.path.join(os.path.dirname(__file__), '..', 'messages')
LANGS = ['ar','de','en','es','fr','hi','id','ja','ko','pt','ru','th','tr','vi','zh-CN','zh-TW']

# Keys from the stash we want to merge in (additions beyond HEAD)
NAV_KEYS_TO_MERGE = ['heatmap', 'screener', 'short']
TOP_LEVEL_KEYS_TO_MERGE = ['supply']  # entire section

for lang in LANGS:
    path = os.path.join(MESSAGES_DIR, f'{lang}.json')
    # Load HEAD version (current working tree)
    with open(path, encoding='utf-8') as f:
        head = json.load(f)
    # Load stash version
    stash_content = subprocess.check_output(
        ['git', 'show', f'stash@{{0}}:messages/{lang}.json'],
        cwd=os.path.join(os.path.dirname(__file__), '..'),
    ).decode('utf-8')
    stash = json.loads(stash_content)

    changes = []
    # Merge nav additions
    for k in NAV_KEYS_TO_MERGE:
        if k in stash.get('nav', {}) and k not in head.get('nav', {}):
            head.setdefault('nav', {})[k] = stash['nav'][k]
            changes.append(f'nav.{k}')
    # Merge top-level sections
    for k in TOP_LEVEL_KEYS_TO_MERGE:
        if k in stash and k not in head:
            head[k] = stash[k]
            changes.append(k)

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(head, f, ensure_ascii=False, indent=2)
        f.write('\n')
    print(f'  {lang}: merged {changes}')

print('Done.')

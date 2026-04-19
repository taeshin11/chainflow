#!/usr/bin/env python3
"""
Upgrade `try { await redis.set(...); } catch { /* non-fatal */ }` patterns to
`await loggedRedisSet(redis, 'source', ...)` for uniform structured logging.

Only rewrites files that already import logger; adds loggedRedisSet to the import.
"""
import re, os, sys
sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.join(os.path.dirname(__file__), '..')

# (filepath, logger_source_tag)
TARGETS = [
    ('src/app/api/capital-flows/route.ts',       'api.capital-flows'),
    ('src/app/api/macro-indicators/route.ts',    'api.macro-indicators'),
    ('src/app/api/fear-greed/route.ts',          'api.fear-greed'),
    ('src/app/api/fedwatch/route.ts',            'api.fedwatch'),
    ('src/app/api/credit-balance/route.ts',      'api.credit-balance'),
    ('src/app/api/news-cascade/route.ts',        'api.news-cascade'),
    ('src/app/api/market-heatmap/route.ts',      'api.market-heatmap'),
    ('src/app/api/stock-supply/route.ts',        'api.stock-supply'),
    ('src/app/api/flow-analysis/route.ts',       'api.flow-analysis'),
    ('src/app/api/translate/route.ts',           'api.translate'),
    ('src/app/api/company-financials/[ticker]/route.ts', 'api.company-financials'),
    ('src/app/api/latest-updates/route.ts',      'api.latest-updates'),
    ('src/app/api/ai/route.ts',                  'api.ai'),
    ('src/app/api/cron/update-signals/route.ts', 'cron.update-signals'),
    ('src/app/api/cron/update-credit-balance/route.ts', 'cron.update-credit-balance'),
    ('src/app/api/osint/corporate/route.ts',     'api.osint-corporate'),
    ('src/app/api/osint/crypto/route.ts',        'api.osint-crypto'),
    ('src/app/api/osint/sanctions/route.ts',     'api.osint-sanctions'),
]

# Matches the common pattern (with or without surrounding if-redis block)
PATTERNS = [
    # try { await redis.set(KEY, VAL, { ex: TTL }); } catch { /* non-fatal */ }
    (re.compile(r"try\s*\{\s*await\s+redis\.set\(\s*([^,]+),\s*([^,]+),\s*(\{[^}]+\})\s*\)\s*;\s*\}\s*catch\s*\{\s*[^}]*\}"),
     "await loggedRedisSet(redis, '{source}', {0}, {1}, {2})"),
    # plain: await redis.set(KEY, VAL, { ex: TTL });  (no try wrapper)
    (re.compile(r"await\s+redis\.set\(\s*([^,]+),\s*([^,]+),\s*(\{[^}]+\})\s*\)\s*;"),
     "await loggedRedisSet(redis, '{source}', {0}, {1}, {2});"),
]

def upgrade_file(path, source_tag):
    full = os.path.join(ROOT, path)
    if not os.path.exists(full):
        print(f'  SKIP (missing): {path}')
        return False
    with open(full, encoding='utf-8') as f:
        text = f.read()
    orig = text

    # Ensure loggedRedisSet is imported
    # Look for an existing logger import line
    import_pat = re.compile(r"from '@/lib/logger'")
    if import_pat.search(text):
        # If logger is already imported but not loggedRedisSet, add it
        if 'loggedRedisSet' not in text:
            text = re.sub(
                r"import\s+\{([^}]*)\}\s+from\s+'@/lib/logger'",
                lambda m: "import {" + m.group(1).rstrip() + ", loggedRedisSet} from '@/lib/logger'",
                text, count=1)
    else:
        # Add import after the first `import` line
        first_import = re.search(r"^import [^\n]+;", text, re.MULTILINE)
        if first_import:
            text = text[:first_import.end()] + "\nimport { logger, loggedRedisSet } from '@/lib/logger';" + text[first_import.end():]

    # Apply substitutions
    changed = 0
    for pat, tmpl in PATTERNS:
        def sub(m):
            nonlocal changed
            changed += 1
            args = [m.group(i) for i in range(1, len(m.groups()) + 1)]
            return tmpl.format(*args, source=source_tag)
        text = pat.sub(sub, text)

    if text != orig:
        with open(full, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f'  OK    {path}: {changed} write(s) upgraded')
        return True
    else:
        print(f'  -     {path}: no changes')
        return False

print('Upgrading redis.set → loggedRedisSet across API routes...')
for path, tag in TARGETS:
    upgrade_file(path, tag)
print('Done.')

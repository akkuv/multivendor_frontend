# Removes `const { t } = useTranslation()` from plain event handlers and other
# lowercase helpers where a hook is illegal, relying on the enclosing
# component's `t` instead. Used after scripts/add-i18n-hooks.py over-reaches
# into a callback.
#
# Usage: python3 scripts/fix-illegal-hooks.py file.tsx:LINE [...]
import re
import sys
import pathlib

HOOK = re.compile(r"^\s*const \{ t \} = useTranslation\(\)\s*$")


def enclosing_component(lines, idx):
    """Walk outwards to the nearest `function Name(` / `const Name = (` decl."""
    for j in range(idx, -1, -1):
        m = re.match(r"^\s*(?:export\s+)?function\s+([A-Z]\w*)\s*\(", lines[j])
        if m:
            return j
        m = re.match(r"^\s*(?:export\s+)?const\s+([A-Z]\w*)\b[^=]*=\s*\(", lines[j])
        if m:
            return j
        m = re.match(r"^\s*(?:export\s+)?const\s+([A-Z]\w*)\b[^=]*=>", lines[j])
        if m:
            return j
    return None


total = 0
for spec in sys.argv[1:]:
    # spec is path:line:col - drop the column, then the line
    path, _, lineno = spec.rpartition(":")
    path, _, lineno = path.rpartition(":")
    p = pathlib.Path(path)
    lines = p.read_text(encoding="utf-8").split("\n")
    idx = int(lineno) - 1
    if not HOOK.match(lines[idx]):
        print("skip %s: line is not a hook" % spec)
        continue
    comp = enclosing_component(lines, idx)
    if comp is None:
        print("skip %s: no enclosing component found" % spec)
        continue
    # The component must already declare t itself, or nothing will resolve.
    head = "\n".join(lines[comp:idx])
    if "const { t } = useTranslation()" not in head:
        print("skip %s: enclosing component does not declare t" % spec)
        continue
    del lines[idx]
    p.write_text("\n".join(lines), encoding="utf-8")
    total += 1
    print("removed hook at %s" % spec)
print("total removed: %d" % total)

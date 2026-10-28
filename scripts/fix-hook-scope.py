"""Move `const { t } = useTranslation()` to the top of the function body that
owns it, so the hook is never referenced before declaration (TDZ) when the body
has an early return.
"""
import re
import sys
import pathlib

HOOK_RE = re.compile(r"^(\s*)const \{ t \} = useTranslation\(\)\s*$")
USE_RE = re.compile(r"(?<![A-Za-z0-9_$.])t\(")


def find_fn_bodies(lines):
    """Yield (body_start, body_end) line indexes for function/arrow blocks."""
    stack = []
    out = []
    for idx, raw in enumerate(lines):
        clean = raw
        # crude but adequate: strip quoted runs
        clean = re.sub(r"'(\\.|[^'\\])*'", "''", clean)
        clean = re.sub(r'"(\\.|[^"\\])*"', '""', clean)
        clean = re.sub(r"`(\\.|[^`\\])*`", "``", clean)
        clean = re.sub(r"//.*$", "", clean)
        head_end = clean.find("{")
        if head_end >= 0:
            prev = lines[idx - 1].strip() if idx else ""
            head = clean[:head_end]
            sig = prev + " " + head.strip()
            is_fn = bool(
                re.search(r"\bfunction\b", sig)
                or re.search(r"=>\s*$", sig)
                or re.search(r"\)\s*:\s*[^{=;]*$", sig)
            )
            for _ in range(clean.count("{")):
                stack.append([idx, is_fn])
        for _ in range(clean.count("}")):
            if stack:
                s, is_fn = stack.pop()
                if is_fn:
                    out.append((s, idx))
    return out


def fix(path):
    src = path.read_text(encoding="utf-8")
    lines = src.split("\n")
    hook_idx = [i for i, l in enumerate(lines) if HOOK_RE.match(l)]
    if not hook_idx:
        return 0
    bodies = find_fn_bodies(lines)
    # Map hook -> smallest enclosing body
    moves = []  # (hook_idx, target_body_start, indent)
    for h in hook_idx:
        owner = None
        for s, e in bodies:
            if s < h < e:
                if owner is None or (e - s) < (owner[1] - owner[0]):
                    owner = (s, e)
        if owner is None:
            continue
        s, e = owner
        # does the body already declare t above the hook?
        seg = lines[s + 1 : h]
        if any(re.match(r"\s*const \{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\(", x) for x in seg):
            continue
        # is t used above the hook inside this body?
        first_use = None
        for i in range(s + 1, h):
            if USE_RE.search(lines[i]):
                first_use = i
                break
        if first_use is None:
            continue  # already fine
        m = HOOK_RE.match(lines[h])
        moves.append((h, s + 1, m.group(1)))

    if not moves:
        return 0
    # delete from bottom up, then insert from bottom up
    for h, _, _ in sorted(moves, reverse=True):
        del lines[h]
    for h, target, indent in sorted(moves, key=lambda x: -x[1]):
        lines.insert(target, f"{indent}const {{ t }} = useTranslation()")
    path.write_text("\n".join(lines), encoding="utf-8")
    return len(moves)


total = 0
for f in sys.argv[1:]:
    n = fix(pathlib.Path(f))
    if n:
        print(f"{f}: moved {n}")
        total += n
print("total moved:", total)
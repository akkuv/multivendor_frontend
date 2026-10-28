"""Insert `const { t } = useTranslation()` at the true start of every function
body in the given .tsx files that references t( but does not declare it.

A character-level scanner tracks (), [] and {} depth so that a destructured
parameter list (`function F({ a, b })`) and an inline object type annotation are
never mistaken for a function body, and so that nested bodies pair with the
correct closing brace. Control-flow heads (switch/if/for/while/catch/do/else/
try/finally) are excluded because there is no function to hook into.
"""
import re
import sys
import pathlib

HOOK = "const { t } = useTranslation()"
DECL_RE = re.compile(
    r"const\s*\{[^}]*\bt\b[^}]*\}\s*=\s*useTranslation\(|"
    r"\(.*\bt\s*:\s*\(k\s*:\s*string\)\s*=>\s*string.*\)"
)
USE_RE = re.compile(r"(?<![A-Za-z0-9_$.])t\(")
# A `t` parameter on the signature line, e.g. `function badge(status, t) {`.
SIG_RE = re.compile(r"\bt\s*:\s*\(k\s*:\s*string\)\s*=>\s*string\b")

# How far back to look for a signature that wraps over several lines.
SIG_WINDOW = 400


def signature_of(src, body_open):
    """Return the declaration text immediately preceding a body brace.

    cut back to the last statement boundary so an enclosing function's own
    `t` parameter cannot leak in.
    """
    head = src[max(0, body_open - SIG_WINDOW) : body_open]
    cut = max(head.rfind("}"), head.rfind(";"))
    return head[cut + 1 :] if cut >= 0 else head
CONTROL_RE = re.compile(
    r"(?:^|[\s;}])(switch|if|for|while|catch|do|else|try|finally)\b[^;{}]*$"
)


def scan(src):
    """Return [(body_open_idx, body_close_idx)] for every function body."""
    # no pre-masking: offsets must stay identical to the original text
    # stack of open braces: (offset, is_fn_body)
    stack = []
    pairs = []
    i = 0
    n = len(src)
    paren = brack = 0
    last_sig = ""

    def push_char(ch):
        nonlocal last_sig
        if not ch.isspace():
            last_sig += ch
            if len(last_sig) > 80:
                last_sig = last_sig[-50:]

    while i < n:
        c = src[i]
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i)
            i = n if j < 0 else j + 2
            continue
        if c == "'" and i > 0 and (src[i - 1].isalnum() or src[i - 1] in "_'"):
            # An apostrophe glued to a word is prose, not a string delimiter:
            # JSX text says "every category's subcategory flow". Treating it
            # as a string open swallows real code - including closing braces -
            # until the next quote, which unbalances every later brace.
            push_char(c)
            i += 1
            continue
        if c in "\"'`":
            quote = c
            i += 1
            while i < n:
                if src[i] == "\\":
                    i += 2
                    continue
                if src[i] == quote:
                    i += 1
                    break
                i += 1
            push_char('"S"')
            continue
        if c == "(":
            paren += 1
            push_char(c)
            i += 1
            continue
        if c == ")":
            paren -= 1
            push_char(c)
            i += 1
            continue
        if c == "[":
            brack += 1
            push_char(c)
            i += 1
            continue
        if c == "]":
            brack -= 1
            push_char(c)
            i += 1
            continue
        if c == "{":
            is_fn = False
            if paren == 0 and brack == 0:
                # Read the signature straight from the source: last_sig is a
                # truncated tail and loses long parameter lists, which made
                # `export function LongName(props) {` look like an object body.
                before = src[max(0, i - 400) : i].rstrip()
                if CONTROL_RE.search(before):
                    is_fn = False
                elif re.search(r"\bfunction\b[\w\s*]*\s*\([^()]*(?:\([^()]*\)[^()]*)*\)\s*$", before):
                    is_fn = True
                elif re.search(r"=>\s*$", before):
                    is_fn = True
                elif re.search(r"\)\s*$", before) and not re.search(r"[{}=]\s*$", before):
                    # `) {` at depth 0 is a signature close paren, unless the
                    # preceding text shows an object literal.
                    is_fn = True
            stack.append((i, is_fn))
            i += 1
            last_sig = "{"
            continue
        if c == "}":
            if stack:
                off, is_fn = stack.pop()
                if is_fn:
                    pairs.append((off, i))
            i += 1
            last_sig = "}"
            continue
        push_char(c)
        i += 1
    return pairs


def process(path):
    src = path.read_text(encoding="utf-8")
    pairs = scan(src)
    if not pairs:
        return 0

    inserts = []  # (offset, indent)
    for a, b in sorted(pairs):
        body = src[a + 1 : b]
        # Blank out nested function bodies so a hook or a t() call that belongs
        # to an inner component is not credited to this scope.
        own = body
        for na, nb in pairs:
            if a < na and nb < b:
                rel = own.find(src[na : nb + 1])
                if rel >= 0:
                    own = own[:rel] + " " * (nb - na + 1) + own[rel + nb - na + 1 :]
        if not USE_RE.search(own):
            continue
        if DECL_RE.search(own):
            continue
        # A `t` parameter supplies `t` just as well as a hook, so a helper
        # written as `function statusBadge(status, t) { ... }` must not get a
        # hook as well. scan() reports the body's opening brace, so the
        # signature sits *before* the range and has to be read separately. A
        # signature can wrap over several lines, so look back a fixed window and
        # cut it at the nearest statement boundary.
        if SIG_RE.search(signature_of(src, a)):
            continue
        nl = src.find("\n", a)
        if nl < 0 or nl >= b:
            continue
        rest = src[nl + 1 : b]
        m = re.match(r"[ \t]*", rest)
        if not m or not m.group(0):
            continue
        inserts.append((nl + 1, m.group(0)))

    if not inserts:
        return 0

    for off, indent in sorted(inserts, reverse=True):
        src = src[:off] + indent + HOOK + "\n" + src[off:]

    if not re.search(r"^import \{ useTranslation \} from 'react-i18next'", src, re.M):
        best = 0
        for m in re.finditer(r"^import\b", src, re.M):
            j = m.end()
            depth = 0
            while j < len(src):
                ch = src[j]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                elif ch == "\n" and depth <= 0:
                    break
                j += 1
            end = src.find("\n", j)
            best = max(best, end + 1 if end >= 0 else len(src))
        src = src[:best] + "import { useTranslation } from 'react-i18next'\n" + src[best:]

    path.write_text(src, encoding="utf-8")
    return len(inserts)


# Guarded so scripts/wrap-config-labels.mjs can import scan() from this module
# without the rewrite running.
if __name__ == "__main__":
    total = 0
    for f in sys.argv[1:]:
        n = process(pathlib.Path(f))
        if n:
            print(f"{f}: +{n}")
            total += n
    print("total:", total)
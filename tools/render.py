"""Рендер model/er.mmd -> model/er.svg (+ model/er.md для GitHub-рендеру Mermaid).

Джерело істини — декларативний model/er.mmd (Mermaid erDiagram).
Скрипт розбирає його і малює діаграму через Graphviz (`dot`) з нотацією
«воронячої лапки»: нічого не додається вручну, лише те, що є в .mmd.
Використання: python3 tools/render.py
"""
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "model" / "er.mmd"


def find_dot() -> str:
    candidates = [
        os.environ.get("GRAPHVIZ_DOT"),
        shutil.which("dot"),
        r"C:\Program Files\Graphviz\bin\dot.exe",
        r"C:\Program Files (x86)\Graphviz\bin\dot.exe",
    ]
    for candidate in candidates:
        if not candidate:
            continue
        path = Path(candidate).expanduser()
        if path.exists():
            return str(path)
    raise SystemExit("Graphviz 'dot' is not installed or not in PATH. Install Graphviz or set GRAPHVIZ_DOT and rerun: python tools/render.py")


DOT = find_dot()
text = SRC.read_text(encoding="utf8")

# Маркер кардинальності Mermaid -> стиль стрілки Graphviz
LEFT = {"||": "teetee", "|o": "teeodot", "}o": "crowodot", "}|": "crowtee"}
RIGHT = {"||": "teetee", "o|": "teeodot", "o{": "crowodot", "|{": "crowtee"}

entities = {}
for m in re.finditer(r"^\s+(\w+) \{(.*?)\}", text, re.S | re.M):
    rows = []
    for line in m.group(2).strip().splitlines():
        parts = line.split()
        rows.append((parts[0], parts[1], " ".join(parts[2:])))
    entities[m.group(1)] = rows

rels = re.findall(
    r'^\s+(\w+) (\|\||\|o|\}o|\}\|)--(\|\||o\||o\{|\|\{) (\w+) : "?([^"\n]+)"?\s*$',
    text,
    re.M,
)

dot = [
    "digraph ER {",
    '  graph [rankdir=LR, splines=true, nodesep=0.6, ranksep=1.1, pad=0.3, bgcolor="white"];',
    '  node [shape=plain, fontname="Helvetica", fontsize=11];',
    '  edge [fontname="Helvetica", fontsize=10, color="#444444", labeldistance=1.5];',
]
for name, rows in entities.items():
    t = [f'<TABLE BORDER="0" CELLBORDER="1" CELLSPACING="0" CELLPADDING="4">',
         f'<TR><TD COLSPAN="3" BGCOLOR="#dbe7f5"><B>{name}</B></TD></TR>']
    for typ, field, flag in rows:
        t.append(
            f'<TR><TD ALIGN="LEFT"><FONT COLOR="#555555">{typ}</FONT></TD>'
            f'<TD ALIGN="LEFT">{field}</TD>'
            f'<TD ALIGN="CENTER">{"<B>" + flag + "</B>" if flag else "&nbsp;"}</TD></TR>'
        )
    t.append("</TABLE>")
    dot.append(f"  {name} [label=<{''.join(t)}>];")
for a, lm, rm, b, label in rels:
    dot.append(
        f'  {a} -> {b} [dir=both, arrowtail={LEFT[lm]}, arrowhead={RIGHT[rm]}, label="{label}"];'
    )
dot.append("}")

dot_src = "\n".join(dot)
svg = subprocess.run(
    [DOT, "-Tsvg"], input=dot_src, text=True, capture_output=True
)
if svg.returncode != 0:
    sys.exit("dot failed:\n" + svg.stderr)
svg = svg.stdout
(ROOT / "model" / "er.svg").write_text(svg, encoding="utf8")
png = subprocess.run([DOT, "-Tpng", "-Gdpi=120"], input=dot_src.encode(), capture_output=True, check=True).stdout
(ROOT / "model" / "er.png").write_bytes(png)
(ROOT / "model" / "er.md").write_text(
    "# ER-діаграма (генерується з er.mmd, не редагувати вручну)\n\n"
    "```mermaid\n" + text.strip() + "\n```\n\n"
    "Статичний рендер: [er.svg](er.svg)\n",
    encoding="utf8",
)
print(f"OK: {len(entities)} сутностей, {len(rels)} зв'язків -> model/er.svg, er.png, er.md")
sys.exit(0)

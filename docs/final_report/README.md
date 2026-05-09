# Final Report — Build Instructions

Source files:

- `main.tex` — the LaTeX source
- `references.bib` — BibTeX bibliography (uses `natbib`, `plainnat` style)

## Option A — Overleaf (no install required)

1. Go to https://www.overleaf.com and create a new blank project.
2. Upload both `main.tex` and `references.bib` to the project root.
3. Set the main document to `main.tex` and the compiler to **pdfLaTeX**.
4. Click **Recompile**. Overleaf runs `pdflatex` + `bibtex` + `pdflatex` automatically.
5. Download the resulting `main.pdf` and rename it to your preferred filename
   (e.g., `2022510140_2022510014_FINAL_REPORT.pdf`).

## Option B — Local pdfLaTeX (macOS)

If you prefer building locally:

```bash
# Install BasicTeX (~100 MB) — much smaller than the full MacTeX
brew install --cask basictex

# After install, restart your shell or eval the new PATH:
eval "$(/usr/libexec/path_helper)"

# Install the extra packages this report needs
sudo tlmgr update --self
sudo tlmgr install collection-fontsrecommended natbib cleveref \
                   enumitem booktabs caption subcaption microtype \
                   pgfplots tikz-cd
```

Then build:

```bash
cd docs/final_report
pdflatex main.tex
bibtex main
pdflatex main.tex
pdflatex main.tex
```

(The two final `pdflatex` runs are required so cross-references and citations
resolve properly.)

The output is `main.pdf` in the same directory.

## Option C — VS Code with LaTeX Workshop

1. Install the [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) extension.
2. Make sure you have a TeX distribution installed (BasicTeX or MacTeX).
3. Open `main.tex` in VS Code.
4. The extension will automatically run `latexmk` and produce `main.pdf` in the
   same directory whenever you save.

## What the report covers

| Section | Pages (approx.) |
|---|---|
| Abstract + ToC | 1 |
| 1. Introduction | 1 |
| 2. Literature Review (summary, references Part 1) | 1 |
| 3. Project Definition (aim, modules, architecture, data flow) | 2–3 |
| 4. Implementation (dataset, model, threshold mapping, strict mode) | 2 |
| 5. Results and Discussion (metrics, latency, limitations) | 2 |
| 6. Conclusion and Future Work | 1 |
| References | 1 |

## Editing tips

- The two TikZ figures (architecture, data flow) compile inline — no external
  image files required.
- The numerical claims (accuracy, F1, training wall-clock) are pulled directly
  from `ml/metrics.json` so they match the in-app metrics page.
- If you want to update the date on the title page, change `\date{\today}` to
  a hard-coded date such as `\date{May 2026}`.

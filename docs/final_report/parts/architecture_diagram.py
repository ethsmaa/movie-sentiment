"""Render the CineSentiment architecture diagram as a high-resolution PNG.

Output: docs/final_report/parts/architecture_diagram.png
Run:    python architecture_diagram.py
"""

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from matplotlib.patches import Rectangle


def draw_block(ax, x, y, w, h, title, subtitle, color, edge="#1f2937"):
    box = FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.04,rounding_size=0.12",
        facecolor=color, edgecolor=edge, linewidth=1.4,
    )
    ax.add_patch(box)
    ax.text(x + w / 2, y + h / 2 + 0.18, title,
            ha="center", va="center",
            fontsize=11, fontweight="bold", color="#0f172a")
    if subtitle:
        ax.text(x + w / 2, y + h / 2 - 0.22, subtitle,
                ha="center", va="center",
                fontsize=8.5, color="#475569", style="italic")


def arrow(ax, x1, y1, x2, y2, label=None, label_offset=(0, 0.18)):
    a = FancyArrowPatch(
        (x1, y1), (x2, y2),
        arrowstyle="-|>", mutation_scale=14,
        linewidth=1.5, color="#1f2937",
    )
    ax.add_patch(a)
    if label:
        ax.text((x1 + x2) / 2 + label_offset[0],
                (y1 + y2) / 2 + label_offset[1],
                label, ha="center", va="center",
                fontsize=8, color="#475569",
                bbox=dict(boxstyle="round,pad=0.18",
                          facecolor="white",
                          edgecolor="none", alpha=0.9))


def main():
    fig, ax = plt.subplots(figsize=(15, 8))
    ax.set_xlim(0, 15)
    ax.set_ylim(0, 8)
    ax.axis("off")

    # Section header bands
    ax.text(2.0, 7.4, "TRAIN", fontsize=11, fontweight="bold",
            color="#3b82f6", ha="center")
    ax.text(5.5, 7.4, "STORE", fontsize=11, fontweight="bold",
            color="#10b981", ha="center")
    ax.text(9.0, 7.4, "SERVE", fontsize=11, fontweight="bold",
            color="#f97316", ha="center")
    ax.text(13.0, 7.4, "CONSUME", fontsize=11, fontweight="bold",
            color="#a855f7", ha="center")

    # ROW 1 — pipeline (Train -> Store -> Serve -> Application)
    draw_block(ax, 0.5, 5.4, 3.0, 1.6,
               "Google Colab",
               "T4 GPU · 14 min · 3 epochs",
               "#dbeafe")

    draw_block(ax, 4.0, 5.4, 3.0, 1.6,
               "Hugging Face Hub",
               "ethsmaa/cinesentiment-\ndistilbert-imdb",
               "#d1fae5")

    draw_block(ax, 7.5, 5.4, 3.0, 1.6,
               "FastAPI Sidecar",
               "Apple MPS · ~50ms\nport 8001",
               "#ffedd5")

    draw_block(ax, 11.5, 5.4, 3.0, 1.6,
               "Hono + tRPC",
               "Application Server\nport 3001",
               "#f3e8ff")

    # ROW 2 — data plane below the application server
    draw_block(ax, 7.5, 2.2, 3.0, 1.4,
               "PostgreSQL",
               "movies · reviews\nsentiment_analyses",
               "#fee2e2")

    draw_block(ax, 11.5, 2.2, 3.0, 1.4,
               "React + Vite UI",
               "port 5173",
               "#fae8ff")

    # Connecting arrows
    # Train -> Store
    arrow(ax, 3.5, 6.2, 4.0, 6.2, label="push")

    # Store -> Serve (one-time)
    arrow(ax, 7.0, 6.2, 7.5, 6.2, label="download (once)")

    # Serve -> Application
    arrow(ax, 10.5, 6.2, 11.5, 6.2, label="HTTP")

    # Application -> DB (diagonal)
    arrow(ax, 12.0, 5.4, 9.5, 3.6, label="Prisma",
          label_offset=(-0.05, 0.18))

    # Application -> UI (straight down)
    arrow(ax, 13.0, 5.4, 13.0, 3.6, label="tRPC",
          label_offset=(0.4, 0))

    # Title
    fig.suptitle("CineSentiment — End-to-End System Architecture",
                 fontsize=14, fontweight="bold", y=0.95, color="#0f172a")

    # Footer
    ax.text(7.5, 1.0,
            "Each layer can be replaced independently.\n"
            "Training and storage live in the cloud; serving and consumption run on the local machine.",
            ha="center", va="center", fontsize=9.5, color="#475569", style="italic")

    plt.tight_layout(rect=[0, 0, 1, 0.95])
    out = "architecture_diagram.png"
    plt.savefig(out, dpi=200, bbox_inches="tight", facecolor="white")
    print(f"Saved {out}")


if __name__ == "__main__":
    main()

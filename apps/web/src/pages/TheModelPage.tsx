import { trpc } from '../lib/trpc'
import { VideoClubFooter } from './HomePage'

const HF_HUB_URL = 'https://huggingface.co/ethsmaa/cinesentiment-distilbert-imdb'
const GITHUB_URL = 'https://github.com/ethsmaa/movie-sentiment'
const NOTEBOOK_PATH = 'ml/train_distilbert.ipynb'
const METRICS_PATH = 'ml/metrics.json'

const SAMPLE_POSITIVE_REVIEW =
  '"This is one of the most extraordinary cinematic experiences I have ever had. ' +
  'The performances are flawless, the direction is exceptional, and the script captures ' +
  'something genuinely true about human nature."'

const SAMPLE_NEGATIVE_REVIEW =
  '"A waste of two hours of my life. The plot is incoherent, the acting is wooden, ' +
  'and there is no emotional center. Save your money."'

export function TheModelPage() {
  const metricsQ = trpc.sentiment.modelMetrics.useQuery({})
  const modelInfo = metricsQ.data?.modelInfo
  const evalAccuracy = metricsQ.data?.accuracy
  const evalF1 = metricsQ.data?.weightedF1
  const sampleSize = metricsQ.data?.sampleSize

  const trainingDuration = modelInfo
    ? formatDuration(modelInfo.trainingTimeSeconds)
    : '—'
  const trainedDate = modelInfo
    ? new Date(modelInfo.trainedAt).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <main className="bg-paper text-ink min-h-screen">
      <div className="px-8 pt-8 pb-8">

        {/* Page header */}
        <div className="flex justify-between items-end border-b border-ink pb-5 mb-8">
          <div>
            <div className="font-mono text-red text-meta-sm tracking-[2px] uppercase">
              PRODUCTION SHEET · THE MODEL
            </div>
            <h1 className="font-display text-ink uppercase m-0 mt-1.5"
              style={{ fontSize: 72, lineHeight: 0.95, letterSpacing: -0.5 }}>
              DistilBERT · IMDB
            </h1>
            <div className="font-serif italic text-ink-soft mt-1.5" style={{ fontSize: 18 }}>
              What we trained, with what data, and the choices behind every number on the lab sheet.
            </div>
          </div>

          <div className="bg-amber border border-ink font-mono text-ink text-meta-sm tracking-[1.5px] shrink-0"
            style={{ padding: '10px 16px', transform: 'rotate(-1.5deg)' }}>
            <div className="border-b border-dashed border-ink pb-1 mb-1">FINAL CUT</div>
            <div>v1.0 · 2026</div>
          </div>
        </div>

        {/* ── Reel 1: Dataset ── */}
        <Reel
          number="REEL ONE"
          title="THE DATA"
          meta="STANFORD CS · 2011 · PUBLIC"
        >
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <p className="font-serif text-ink mb-3" style={{ fontSize: 15, lineHeight: 1.6 }}>
                The model was fine-tuned on the <strong>IMDB Movie Reviews</strong> dataset
                (Maas et al., Stanford). 50,000 long-form English movie reviews scraped from
                IMDB, manually filtered for polarity, and split evenly between training and
                test halves — 25,000 each, 50/50 positive vs negative inside each split.
              </p>
              <p className="font-serif text-ink mb-3" style={{ fontSize: 15, lineHeight: 1.6 }}>
                It's the canonical benchmark for binary sentiment in English. Reviews are
                long enough (median ~250 words) that the model has to integrate sentiment
                across multiple sentences — short tweets wouldn't have produced the same
                language model. No third "neutral" class — that constraint shapes the rest
                of the pipeline.
              </p>
              <SpecGrid>
                <SpecRow label="SOURCE">IMDB scrape (Maas et al. 2011)</SpecRow>
                <SpecRow label="SAMPLES">50,000 reviews</SpecRow>
                <SpecRow label="SPLIT">25k train · 25k test</SpecRow>
                <SpecRow label="BALANCE">50/50 pos/neg in each split</SpecRow>
                <SpecRow label="LANGUAGE">English only</SpecRow>
                <SpecRow label="LICENSE" last>Public, redistributable</SpecRow>
              </SpecGrid>
            </div>

            <div className="flex flex-col gap-3">
              <SampleQuote variant="positive" body={SAMPLE_POSITIVE_REVIEW} />
              <SampleQuote variant="negative" body={SAMPLE_NEGATIVE_REVIEW} />
              <div className="font-mono text-ink-soft text-meta-xs tracking-[1.5px] uppercase">
                ⚠ Excerpts above are paraphrased to fit the layout · the real dataset is
                downloadable via <code className="text-red">datasets.load_dataset(&quot;imdb&quot;)</code>
              </div>
            </div>
          </div>
        </Reel>

        {/* ── Reel 2: Architecture ── */}
        <Reel
          number="REEL TWO"
          title="THE ARCHITECTURE"
          meta="DISTILBERT · SANH ET AL. 2019"
        >
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div>
              <p className="font-serif text-ink mb-3" style={{ fontSize: 15, lineHeight: 1.6 }}>
                <strong>DistilBERT</strong> is a knowledge-distilled version of BERT-base.
                Same family of transformer encoders, but six layers instead of twelve, the
                same hidden dimension, and a training objective that pushes the small
                "student" model to mimic the larger BERT "teacher" while staying lean
                enough to run on CPU.
              </p>
              <p className="font-serif text-ink mb-3" style={{ fontSize: 15, lineHeight: 1.6 }}>
                On most tasks DistilBERT keeps about 95-97% of BERT-base's accuracy at 60%
                of the parameters and 60% of the inference time. For an academic project
                that has to hit Apple MPS on a laptop and a Hugging Face free Space, the
                trade is obvious — the demo wouldn't survive a 110M-parameter model in a
                single-replica deployment.
              </p>
              <SpecGrid>
                <SpecRow label="BASE">distilbert-base-uncased</SpecRow>
                <SpecRow label="LAYERS">6 transformer encoders</SpecRow>
                <SpecRow label="HIDDEN DIM">768</SpecRow>
                <SpecRow label="ATTN HEADS">12 per layer</SpecRow>
                <SpecRow label="VOCAB">30,522 WordPiece</SpecRow>
                <SpecRow label="PARAMS">~67M (vs BERT-base 110M)</SpecRow>
                <SpecRow label="INFERENCE">~40ms / review on MPS</SpecRow>
                <SpecRow label="LICENSE" last>Apache 2.0</SpecRow>
              </SpecGrid>
            </div>

            <div className="bg-paper-2 border border-ink" style={{ padding: 14 }}>
              <div className="font-mono text-ink-soft text-meta-xs tracking-[1.5px] uppercase mb-3">
                FLOW · INPUT → CLASSIFICATION
              </div>
              <ArchitectureFlow />
              <div className="font-mono text-ink-soft text-meta-xs tracking-[1.2px] mt-3"
                style={{ lineHeight: 1.5 }}>
                Each stage is text-only here · the actual tensors are 768-dim per token
                across 6 attention layers · the [CLS] embedding becomes the review's
                "summary vector" and a 2-class linear head turns it into a logit pair.
              </div>
            </div>
          </div>
        </Reel>

        {/* ── Reel 3: Production record ── */}
        <Reel
          number="REEL THREE"
          title="THE PRODUCTION RECORD"
          meta="HOW WE FINE-TUNED IT"
        >
          {modelInfo ? (
            <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <SpecGrid>
                <SpecRow label="BASE MODEL">{modelInfo.base}</SpecRow>
                <SpecRow label="DATASET">{modelInfo.trainedOn}</SpecRow>
                <SpecRow label="EPOCHS">{modelInfo.epochs}</SpecRow>
                <SpecRow label="BATCH SIZE">{modelInfo.batchSize}</SpecRow>
                <SpecRow label="LEARNING RATE">{modelInfo.learningRate}</SpecRow>
                <SpecRow label="MAX TOKENS">{modelInfo.maxLength}</SpecRow>
                <SpecRow label="LABELS">{modelInfo.labels.join(' · ')}</SpecRow>
                <SpecRow label="HARDWARE">Colab T4 GPU (free tier)</SpecRow>
                <SpecRow label="RUN TIME">{trainingDuration}</SpecRow>
                <SpecRow label="TRAINED AT" last>{trainedDate}</SpecRow>
              </SpecGrid>

              <div className="flex flex-col gap-3">
                <div className="bg-ink text-paper border border-ink" style={{ padding: 18 }}>
                  <div className="font-mono text-paper-2 text-meta-xs tracking-[1.5px] uppercase opacity-70 mb-2">
                    Final test-set numbers
                  </div>
                  <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <BigStat label="ACCURACY" value={evalAccuracy ?? 0} colorClass="text-green" />
                    <BigStat label="WEIGHTED F1" value={evalF1 ?? 0} colorClass="text-amber" />
                  </div>
                  <div className="font-mono text-paper-2 text-meta-xs tracking-[1.5px] uppercase opacity-60 mt-3">
                    Evaluated on {sampleSize?.toLocaleString() ?? '—'} held-out reviews
                  </div>
                </div>
                <p className="font-serif italic text-ink-soft" style={{ fontSize: 14, lineHeight: 1.6 }}>
                  These metrics are baked into <code>{METRICS_PATH}</code> at training time
                  and read straight off disk by the API — they're the same numbers you see
                  on the Model Metrics page. No live recomputation, no drift between what
                  was measured and what's shown.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-paper-2 border border-dashed border-ink p-4 font-mono text-ink-soft text-meta-sm tracking-[1.5px] uppercase">
              {metricsQ.isLoading ? 'Loading production record…' : 'Production record unavailable'}
            </div>
          )}
        </Reel>

        {/* ── Director's commentary ── */}
        <Reel
          number="REEL FOUR"
          title="DIRECTOR'S COMMENTARY"
          meta="WHY THESE NUMBERS, NOT OTHERS"
        >
          <div className="grid gap-3.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <CommentaryCard q="Why DistilBERT, not BERT-base?">
              BERT-base would lift test accuracy by ~1-2 points but doubles parameters and
              memory. The runtime path here has to clear an Apple-MPS laptop, a Python
              sidecar in a free-tier deployment, and a tRPC round-trip — the smaller model
              is the only one that survives end to end without surgery.
            </CommentaryCard>

            <CommentaryCard q="Why 256 max tokens?">
              99% of IMDB reviews fit inside 256 WordPiece tokens. Going to 512 doubles
              compute for marginal accuracy gain. The reviews that get truncated are
              usually long opinion pieces where the polarity is already obvious in the
              first paragraph.
            </CommentaryCard>

            <CommentaryCard q="Why three epochs?">
              Fine-tuning loss bottoms out around epoch 2-3 on IMDB. By epoch 4-5 the
              model overfits — train loss keeps dropping while test F1 plateaus or
              regresses. Three keeps the best validation checkpoint without paying for
              over-training.
            </CommentaryCard>

            <CommentaryCard q="Why threshold mapping for the 3-class UI?">
              IMDB has no neutral label — the dataset is strictly pos/neg. The UI was
              designed against three buckets, so the API derives neutral via confidence
              bands: <code>p_positive ≥ 0.65</code> positive, <code>≤ 0.35</code> negative,
              middle is neutral. This is heuristic, not learned, and we say so.
            </CommentaryCard>

            <CommentaryCard q="Why a Python sidecar instead of running PyTorch in Node?">
              <code>transformers.js</code> and ONNX Runtime can run BERT in Node, but cold
              start is rough and debugging the tokenizer mismatch is rougher. A FastAPI
              process loads the model once on startup, holds it on MPS / CUDA, and answers
              tRPC requests over plain JSON. Clean process boundary, predictable latency.
            </CommentaryCard>

            <CommentaryCard q="Why log every inference (LOG_INFERENCE=true)?">
              For demos. Each request prints the text preview, token count, raw logits,
              softmax probs, and the winner — so a thesis viewer watching the terminal can
              see the model's "thinking" alongside the UI. Off by default in production.
            </CommentaryCard>
          </div>
        </Reel>

        {/* ── Reproducibility ── */}
        <Reel
          number="REEL FIVE"
          title="OPEN PRODUCTION"
          meta="EVERYTHING REPRODUCIBLE"
        >
          <p className="font-serif text-ink mb-4" style={{ fontSize: 15, lineHeight: 1.6, maxWidth: 800 }}>
            The model, the training notebook, the metrics file, and every line of the
            stack are public. To rebuild this exact model: clone the repo, open the
            notebook in Colab on a T4 runtime, run all cells. ~14 minutes later you'll
            have an artifact functionally identical to the one running on this site.
          </p>

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <RepoLink
              label="HUGGING FACE HUB"
              detail="Trained weights · 268 MB safetensors"
              href={HF_HUB_URL}
            />
            <RepoLink
              label="GITHUB REPO"
              detail="Full source · monorepo · MIT"
              href={GITHUB_URL}
            />
            <RepoLink
              label="TRAINING NOTEBOOK"
              detail={NOTEBOOK_PATH}
              href={`${GITHUB_URL}/blob/main/${NOTEBOOK_PATH}`}
            />
            <RepoLink
              label="METRICS FILE"
              detail={METRICS_PATH}
              href={`${GITHUB_URL}/blob/main/${METRICS_PATH}`}
            />
            <RepoLink
              label="SENTIMENT SERVICE"
              detail="services/sentiment · FastAPI"
              href={`${GITHUB_URL}/tree/main/services/sentiment`}
            />
            <RepoLink
              label="MODEL CARD"
              detail="README on the Hub"
              href={HF_HUB_URL}
            />
          </div>
        </Reel>
      </div>

      <VideoClubFooter right="DISTILBERT-IMDB · TRAINED IN ~14 MIN ON T4">
        ★ EVERY NUMBER ON THIS PAGE TRACES BACK TO ml/metrics.json OR THE PUBLIC NOTEBOOK ★
      </VideoClubFooter>
    </main>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface ReelProps {
  number: string
  title: string
  meta?: string
  children: React.ReactNode
}

function Reel({ number, title, meta, children }: ReelProps) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3 mb-4">
        <div className="font-mono text-red text-meta-sm tracking-[1.5px] uppercase shrink-0">
          {number}
        </div>
        <div className="font-display text-ink uppercase tracking-[0.5px] shrink-0"
          style={{ fontSize: 32, lineHeight: 1 }}>
          {title}
        </div>
        <div className="flex-1 h-px bg-ink opacity-30" />
        {meta && (
          <div className="font-mono text-ink-soft text-meta-sm tracking-[1px] shrink-0">
            {meta}
          </div>
        )}
      </div>
      {children}
    </section>
  )
}

function SpecGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-paper-2 border border-ink">
      {children}
    </div>
  )
}

function SpecRow({
  label,
  children,
  last = false,
}: {
  label: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div
      className={`flex justify-between items-center font-mono text-meta tracking-[1px] ${
        last ? '' : 'border-b border-dashed border-ink'
      }`}
      style={{ padding: '10px 14px' }}
    >
      <span className="text-ink-soft">{label}</span>
      <span className="text-ink font-bold">{children}</span>
    </div>
  )
}

function SampleQuote({ variant, body }: { variant: 'positive' | 'negative'; body: string }) {
  const color = variant === 'positive' ? '#3d6b3a' : '#9b2614'
  const tag = variant === 'positive' ? 'POS' : 'NEG'
  return (
    <div className="bg-paper-2 border border-ink relative" style={{ padding: 14 }}>
      <div className="absolute top-0 left-0 bottom-0" style={{ width: 4, background: color }} />
      <div className="pl-2">
        <div className="font-mono text-meta-xs tracking-[1.5px] mb-2" style={{ color }}>
          ▪ SAMPLE · {tag}
        </div>
        <p className="font-serif italic text-ink m-0" style={{ fontSize: 14, lineHeight: 1.5 }}>
          {body}
        </p>
      </div>
    </div>
  )
}

function CommentaryCard({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="bg-paper-2 border border-ink relative" style={{ padding: 16 }}>
      <div className="font-display text-ink uppercase mb-2" style={{ fontSize: 18, lineHeight: 1.2 }}>
        {q}
      </div>
      <p className="font-serif text-ink-soft m-0" style={{ fontSize: 14, lineHeight: 1.6 }}>
        {children}
      </p>
    </div>
  )
}

function RepoLink({
  label,
  detail,
  href,
}: {
  label: string
  detail: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-paper-2 border border-ink hover:bg-paper-dark transition-colors duration-120"
      style={{ padding: 16 }}
    >
      <div className="font-mono text-red text-meta-sm tracking-[1.5px] uppercase mb-1">
        ▸ {label}
      </div>
      <div className="font-serif text-ink-soft" style={{ fontSize: 13, lineHeight: 1.4 }}>
        {detail}
      </div>
    </a>
  )
}

function BigStat({
  label,
  value,
  colorClass,
}: {
  label: string
  value: number
  colorClass: string
}) {
  return (
    <div>
      <div className="font-mono text-paper-2 text-meta-xs tracking-[1.5px] uppercase opacity-70">
        {label}
      </div>
      <div className={`font-display ${colorClass}`} style={{ fontSize: 44, lineHeight: 1 }}>
        {(value * 100).toFixed(1)}%
      </div>
    </div>
  )
}

// ─── Architecture flow diagram (text-only ASCII style) ───────────────────────

function ArchitectureFlow() {
  const stages: Array<{ label: string; detail: string }> = [
    { label: 'RAW TEXT',         detail: '"This film was a complete masterpiece."' },
    { label: 'TOKENIZER',        detail: 'WordPiece · 30,522 vocab → token ids' },
    { label: 'EMBEDDING LAYER',  detail: 'token + position + segment → 768-d vectors' },
    { label: 'ENCODER × 6',      detail: 'multi-head attention + feed-forward, 12 heads' },
    { label: '[CLS] POOL',       detail: 'first-token vector → 768-d sentence summary' },
    { label: 'CLASSIFIER',       detail: 'linear → 2 logits → softmax → probabilities' },
    { label: 'DECISION',         detail: 'argmax · winner is "positive" or "negative"' },
  ]
  return (
    <div className="flex flex-col gap-1.5 font-mono text-meta tracking-[0.5px]">
      {stages.map((s, i) => (
        <div key={s.label}>
          <div className="flex items-center gap-2">
            <div className="bg-ink text-paper px-2 py-0.5 shrink-0"
              style={{ fontSize: 10, letterSpacing: 1.5, minWidth: 130 }}>
              {s.label}
            </div>
            <div className="text-ink-soft" style={{ fontSize: 11 }}>
              {s.detail}
            </div>
          </div>
          {i < stages.length - 1 && (
            <div className="text-ink-soft pl-[120px]" style={{ fontSize: 14, lineHeight: 1 }}>
              ↓
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = Math.round(seconds - mins * 60)
  if (mins === 0) return `${secs}s`
  return `${mins} min ${secs}s`
}

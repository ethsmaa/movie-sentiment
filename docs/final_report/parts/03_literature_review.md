# PART 3 — Literature Review (Summary)

> Plain text, no bold. Apply Word headings yourself.
> This section is short on purpose: the full literature review was already submitted in Assignment Part 1.

---

WORD HEADING 1: 2. Literature Review (Summary)

A detailed literature review was submitted as Assignment Part 1 of this project. In this final report, we only repeat the conclusions that directly shaped how we built the system.

---

WORD HEADING 2: 2.1 From Shallow Models to Transformers

Yadav and Vishwakarma (2020) review the history of sentiment analysis models, from Naïve Bayes and Support Vector Machines, to CNN and LSTM deep learning models, and finally to attention-based transformer models. They show that performance improves consistently as models become better at understanding bidirectional context (the meaning of a word based on what comes before and after it). Albladi et al. (2025), in a more recent IEEE Access review focused on Twitter data, reach the same conclusion: transformer encoders are now the state of the art, especially on noisy short text such as tweets.

---

WORD HEADING 2: 2.2 Why DistilBERT

Sanh et al. (2019) introduced DistilBERT as a smaller, faster version of BERT (Devlin et al., 2019). DistilBERT is about 40 percent smaller and 60 percent faster than BERT, but keeps around 97 percent of BERT's accuracy on downstream tasks. The original BERT paper (Devlin et al., 2019) and the attention paper by Vaswani et al. (2017) describe the building blocks: multi-head self-attention, positional encoding, and a stack of identical encoder layers. Chintalapudi et al. (2021) show that BERT-class models reach over 90 percent accuracy on Twitter sentiment with relatively little fine-tuning effort. Tan et al. (2022) report further improvements by combining transformers with recurrent layers, which suggests that attention-based encoders are now the default choice rather than an experimental option.

---

WORD HEADING 2: 2.3 What This Means for Our Implementation

The literature points clearly to a fine-tuned DistilBERT as the most cost-effective starting point for our project. Its inference speed is fast enough for interactive web requests on normal hardware. Its parameter count fits comfortably in 2 to 4 GB of GPU memory. Its accuracy on benchmarks like IMDB and SST-2 is very close to the larger BERT-base. For these reasons, DistilBERT was the natural choice for our system, and the implementation choices in Section 3 follow this guidance directly.

---

📸 No screenshot needed in this section.

---

When you finish pasting Part 3 into Word, say "devam" for Part 4 (Project Definition — this one is the longest, with the architecture diagram).

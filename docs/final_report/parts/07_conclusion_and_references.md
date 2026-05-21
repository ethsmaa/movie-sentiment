# PART 7 — Conclusion + References (final part)

> Plain text. Two sub-sections + the reference list.

---

WORD HEADING 1: 6. Conclusion

We presented CineSentiment, a small but complete sentiment analysis platform built around a fine-tuned DistilBERT classifier. The model reaches 0.9151 accuracy and 0.9151 weighted F1 on the IMDB 50k test set, which exceeds the 85 percent target set out in our project proposal. The classifier is hosted on the Hugging Face Hub, served by a FastAPI sidecar with hardware-aware backend selection (CUDA, MPS, or CPU), mediated by a typed Hono and tRPC application server, and visualized through a React frontend that separates pre-computed catalogue analyses from live single-shot inferences.

Beyond the metric, the project's contribution is methodological. We pivoted publicly from the original Twitter (X) plan to the IMDB benchmark, and we explained the change as a labelling and access concern rather than as a convenience. We also made the academic integrity of the predictions an explicit engineering concern by introducing strict-mode enforcement, which prevents the system from silently using a lexicon-based fallback when the trained model is unreachable. Finally, we surfaced the binary-to-three-class mapping in plain language inside the application itself rather than burying it in source code.

The main limitations are that the system is English-only, the catalogue is small (30 movies, 346 reviews), the threshold mapping is a heuristic rather than a learned classifier, and the FastAPI sidecar runs on a single host without horizontal scaling. A natural next step would be to fine-tune a 3-class model on a corpus that natively carries a neutral label, which would replace the threshold heuristic with a learned decision boundary.

---

WORD HEADING 1: 7. References

(Paste each reference as a separate paragraph. Word will not auto-format markdown links — that is fine. The format below follows APA style.)

Albladi, A., Islam, M., & Seals, C. (2025). Sentiment analysis of Twitter data using NLP models: A comprehensive review. IEEE Access, PP, 1–1. https://doi.org/10.1109/ACCESS.2025.3541494

Chintalapudi, N., Battineni, G., & Amenta, F. (2021). Sentiment analysis of Twitter data using bidirectional encoder representations from transformers (BERT). Scientific Reports, 11(1), 8031.

Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of deep bidirectional transformers for language understanding. In Proceedings of NAACL-HLT 2019 (pp. 4171–4186).

Maas, A. L., Daly, R. E., Pham, P. T., Huang, D., Ng, A. Y., & Potts, C. (2011). Learning word vectors for sentiment analysis. In Proceedings of the 49th Annual Meeting of the Association for Computational Linguistics: Human Language Technologies (pp. 142–150). Association for Computational Linguistics.

Sanh, V., Debut, L., Chaumond, J., & Wolf, T. (2019). DistilBERT, a distilled version of BERT: Smaller, faster, cheaper and lighter. arXiv preprint arXiv:1910.01108.

Tan, K. L., Lee, C.-P., Anbananthen, K., & Lim, K. M. (2022). RoBERTa-LSTM: A hybrid model for sentiment analysis with transformers and recurrent neural network. IEEE Access, 10, 1–1. https://doi.org/10.1109/ACCESS.2022.3152828

Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention is all you need. In Advances in Neural Information Processing Systems (Vol. 30).

Wolf, T., Debut, L., Sanh, V., Chaumond, J., Delangue, C., Moi, A., Cistac, P., Rault, T., Louf, R., Funtowicz, M., Davison, J., Shleifer, S., von Platen, P., Ma, C., Jernite, Y., Plu, J., Xu, C., Le Scao, T., Gugger, S., Drame, M., Lhoest, Q., & Rush, A. M. (2020). Transformers: State-of-the-art natural language processing. In Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing: System Demonstrations (pp. 38–45).

Yadav, A., & Vishwakarma, D. K. (2020). Sentiment analysis using deep learning architectures: A review. Artificial Intelligence Review, 53(6), 4335–4385.

---

This is the final part. After pasting it, your Word document is complete:

1. Title page + Abstract (Part 1)
2. Introduction (Part 2)
3. Literature Review summary (Part 3)
4. Project Definition with architecture diagram PNG (Part 4)
5. Implementation (Part 5)
6. Results and Discussion with three tables (Part 6)
7. Conclusion + References (this Part 7)

Don't forget to:
- Apply Word heading styles to "1. Introduction", "2. Literature Review", etc.
- Insert architecture_diagram.png at Section 3.3
- Insert UI screenshots where suggested
- Add page numbers and a table of contents (Word will generate it automatically from your headings)
- Save / export as PDF when finished

# I Hate PDF

A browser-based PDF workspace with local document processing.

## Run

```sh
npm ci
npm run setup:translation
npm run build
npm run dev
```

Open http://localhost:4173. Static output is in `dist/`. The two translation models total about 222 MB. They are downloaded by the setup command, served from `dist/models/`, and excluded from Git. Include this directory when deploying. The build fails if any required model file is missing. No document text is sent to a translation service.

## Editor

- **Edit existing** detects selectable text and its point size. Click a text box to type, use Backspace/Delete, or change the selected text in the sidebar.
- Replacement text retains the detected point size by default. Font, size, color, background, bold, and italic controls are available.
- Undo/redo, zoom, page navigation, drawings, highlights, image placement, redaction, signatures, and form fields are supported.
- **Recognize scanned text** uses local English OCR for image-only pages. OCR fonts and sizes are estimates.
- Export creates flattened page artwork plus a searchable text layer. Replaced/deleted source text is absent from the exported content. Export is a reconstructed document, not an in-place rewrite of original PDF text operators.

Embedded/subset fonts may require fallback glyphs for newly typed characters. Background colors are estimated; edits over images, gradients, tightly overlapping text, and complex rotated layouts need visual review. Longer replacements can overlap nearby content. Hindi translated PDFs use an embedded Noto Devanagari font; the general editor's fallback searchable-text font does not cover every script.

## Newly enabled tools

**Translate PDF:** English → Hindi and Hindi → English using quantized OPUS-MT models on the device. The browser loads the models from the same site and performs inference in a worker. Source PDFs need selectable text; use English OCR first for English scans. Results can be downloaded as PDF or text. Translation preserves content as a new text document, not the original page layout. Review machine translations before use. Cancel stops the worker.

**PDF to PDF/A:** creates a flattened PDF/A-2b archival copy with XMP identification and an embedded sRGB output profile. Forms, links, original selectable text, and signatures are flattened. Representative output passed veraPDF 1.30.2 PDF/A-2b validation; the browser does not run a separate validator on every export.

## Other tools

Merge, split, extract/remove/reorder/rotate pages; image compression or structural saving; images to/from PDF; text-based Office and HTML conversion; page-image PPTX export; crop, watermark, page numbering, password protection/unlocking, recoverable-page rendering, English OCR, selectable-text comparison, extractive summaries, and creation from text/images/local conversation exports remain supported.

Office conversions simplify layout, tables, charts, and embedded content. The editor reconstructs documents. Crop hides content; redaction removes covered pixels and excludes overlapping searchable text. Unlocking needs the current password. Repair cannot recover unreadable content. No account integrations or direct ChatGPT connection are included.

## Verification

`npm test` checks page operations, Unicode, pagination, spreadsheet zero/false/date values, DOCX/XLSX output, sentence-safe translation chunking, Hindi rendering/extraction, erased text pixels, text replacement/deletion in exported PDFs, and preserved point size on reimport.

`npm run test:archive` writes an archival fixture to `/private/tmp/ihatepdf-archive.pdf`. With veraPDF installed, validate it with:

```sh
verapdf --format text --flavour 2b /private/tmp/ihatepdf-archive.pdf
```

Browser checks cover English ↔ Hindi translation, PDF/A output, detected-text typing/deletion/undo/export, and the existing workflows. Native browser download automation can time out in the in-app browser; content checks additionally call the same export functions directly. The older Playwright scripts use machine-specific paths.

The saved Sites hosting project still returns “project not found.” This update is built locally and has not been republished.

## Sources

- [OPUS-MT English → Hindi model](https://huggingface.co/Xenova/opus-mt-en-hi)
- [OPUS-MT Hindi → English model](https://huggingface.co/Xenova/opus-mt-hi-en)
- [PDFKit PDF/A support](https://pdfkit.org/docs/getting_started.html)
- [veraPDF validator](https://docs.verapdf.org/cli/)
- [Noto Devanagari](https://github.com/notofonts/devanagari)

## Writing studio and resume checker

Open `#writing` for source similarity checking and English rewriting, or `#ats` for resume/job-description review. These sections have no account, subscription, or locked findings. Imported PDF, DOCX, TXT and Markdown text stays in the browser.

- **Similarity** compares normalized exact phrases of at least five words against up to 20 supplied sources. Overlaps across sources are counted once. It is not a whole-web or academic-database plagiarism scan; it does not detect all paraphrased copying or certify originality. Quotes count toward overlap.
- **Rewriting** offers an immediate rule-based clarity edit and local AI paraphrasing. AI output is editable and downloadable; users must review facts, names, numbers, negation and citations. No “undetectable AI” score is claimed.
- **Resume review** uses disclosed heuristic weights, not an employer ATS API. It shows job-term matches/misses, section/contact detection, quantified achievements, repeated openings, weak wording, bullet consistency, spelling suggestions and extracted reading order. It cannot verify qualifications, predict hiring, measure a real ATS parse rate, or provide peer benchmarks without data. English spelling is checked using nspell and dictionary-en; names and technical terms can still require manual review.
- Import limit: 20 MB. Similarity input: 100,000 characters, 200,000 characters per source. Local AI: 1,200 words per run for responsiveness. These are processing limits, not premium tiers.

Run `npm run setup:writing` to install the local writing model before building. Include the model and dictionary assets in deployment and portable packages. Run `node tests/review-check.mjs` for the new deterministic regression checks.

Background references: [Greenhouse resume parsing](https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse), [Turnitin similarity interpretation](https://guides.turnitin.com/hc/en-us/articles/23713493434253-Understanding-the-similarity-score-for-students). These explain scope; this website is not affiliated with either service.

Writing model: [Qwen2.5-0.5B-Instruct](https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct), ONNX conversion by [ONNX Community](https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct). Runs locally with Transformers.js, approximately 500 MB. Numerical/negation/length checks can retain the original passage when a rewrite fails basic preservation checks; these checks do not guarantee factual fidelity.

For the standalone website ZIP, run `npm run package` after building. Extract it, then run `python3 start-website.py`; do not open index.html directly. The ZIP includes source, built site, language models, OCR, and dictionaries.

Resume uploads now automatically recognize English text on scanned PDF pages. The report flags the original scan as a parsing risk even when local OCR succeeds. Job targets can be one or two words; supported role titles use clearly labeled general skill profiles, not inferred employer requirements. Unknown short titles use literal matching.

Comparison sources are optional in the writing studio. Without them the tool returns a writing clarity score and visible spelling/style suggestions; plagiarism is explicitly “not assessed.” It cannot assign an evidence-based plagiarism percentage without a comparison database or sources.

### AI-writing estimates
The Writing studio has a separate **Check AI writing** button. Comparison sources are optional and collapsed by default. Pasted text and PDF/DOCX/TXT imports use the same local classifier. English only, 50–5,000 words; 150+ words recommended. It loads about 125 MB on first use, and documents stay on-device.

The MIT-licensed TMR RoBERTa classifier by Oxidane, converted by ONNX Community, is bundled at revision `b9aa251e5bcda7e429fcc936767d921435945b60`. See https://huggingface.co/Oxidane/tmr-ai-text-detector and the bundled model card. Restore with `npm run setup:detector` before building. All text is divided into 480-token chunks; the report exposes each passage score and a token-weighted aggregate. Display thresholds are ≤20 human-leaning, ≥80 AI-leaning, otherwise inconclusive; conflicting high/low passages are also inconclusive. These thresholds are not calibrated. Scores are model outputs, not probabilities of authorship or proportions of AI-generated words. The model can make both false-positive and false-negative errors. It does not establish plagiarism, misconduct, or who wrote a document. Review drafts and source evidence for consequential decisions.

# Publishing on Render

This site is prepared for a Render Static Site. Connect your GitHub and Render accounts before publication. No live deployment or revenue account is implied by this configuration.

1. Create a GitHub repository and upload source, package-lock.json, scripts, tests, render.yaml, .github, and dist's HTML/CSS/fonts/favicon. Do not upload node_modules, model binaries, generated assets, local credentials, .openai, or deliverables.
2. In Render choose New > Blueprint and select the repository. render.yaml builds all four model families and bundles browser assets. The models are downloaded during build, not committed to GitHub.
3. Render assigns a free HTTPS *.onrender.com subdomain. A custom registered domain is optional and is not purchased by this project.
4. Set SITE_URL to the assigned HTTPS origin and rebuild to generate canonical URLs and sitemap.xml. Submit that sitemap to your search engine webmaster tools.
5. Verify the live PDF worker returns JavaScript (not HTML), exercise PDF conversion, OCR and each AI tool, inspect CSP errors, and check security/cache headers before announcing launch.

## Security and performance

Document processing stays local. The Render configuration blocks framing, restricts script/network origins, disables object embeds and unused browser capabilities, and sets nosniff/referrer headers. PDF.js evaluation is disabled. File count and aggregate-size limits reduce accidental memory exhaustion; they do not make hostile documents harmless. Hash-named chunks cache for a year; entry points revalidate to avoid stale worker errors. Tool engines load only when requested. Keep dependencies patched and run npm audit regularly. This is not a penetration-test certification.

## Advertising

Ads are deliberately disabled until there is an approved publisher account. Do not add invented publisher IDs or ads.txt records. Start with ONE manually placed, clearly labeled ad on informational/home pages only, below the main tools. No popups, auto ads, interstitials, download-lookalike ads, or ads next to file actions. Keep ad scripts off document-processing routes: third-party scripts share page privileges and can undermine file privacy. A separate marketing origin is preferable for ads. Enable applicable consent management and update privacy disclosures/CSP before loading ad scripts. Google approval, eligible traffic, and payment setup are required; earnings are not guaranteed. No API keys or passwords belong in the repository.

## Known limits

No whole-web plagiarism database is connected. AI authorship and ATS scores are estimates. Text conversion does not preserve complex original layouts. Large AI models (~850 MB total across features) consume bandwidth when visitors first use them; monitor Render's included bandwidth/build-minute allowance. The free subdomain is not ownership of a free custom domain.

---
name: tarshar-learning-series-manager
description: Design, extend, and publish flexible Tarshar learning series from any repeatable source type, including an author's article collection, a teacher's multi-lesson course, videos, podcasts, papers, books, cases, projects, trips, or future formats. Use when turning one or many related items into detailed notes, evidence-linked interactive nodes, Drive archives, GitHub websites, and shared-portal entries; when continuing an existing series in a fresh chat; or when checking whether a series deliverable is genuinely complete. Treat 直播電台 and thesis literature as optional reference profiles, never as fixed limits.
---

# Tarshar 系列學習成果總管

Turn any repeatable body of learning material into a durable, searchable series and connect it to Tarshar's shared entry portal. Infer the right structure from the material instead of forcing every source into a course or paper template. Preserve established naming, visual language, source evidence, Drive filing, and publishing behavior across fresh conversations and across Codex or Claude.

## Start from the real source

1. Identify the requested series and exact source link or file.
2. Inspect the real Google Drive folder, local files, existing website, and current portal before proposing changes.
3. Reuse the existing series folder, numbering, repository, page style, and naming rules.
4. Do not infer completion from a filename or a prior chat statement. Verify the actual files and live links.
5. Ask the user to intervene only when an authentication or permission screen truly requires them.

## Design before routing

Always read [references/new-series.md](references/new-series.md) completely first. Define or recover the series contract from the actual source and existing artifacts before selecting any optional profile.

- For an author's essays, newsletters, columns, blog posts, or article collection, also read [references/author-articles.md](references/author-articles.md).
- For one teacher's course, a multi-lesson class, workshop, lecture sequence, or training program, also read [references/course-series.md](references/course-series.md).
- For a 直播電台 episode, optionally use [references/live-radio.md](references/live-radio.md) as an established profile.
- For a thesis paper or literature library, optionally use [references/thesis-literature.md](references/thesis-literature.md) as an established profile.
- For any other source type, derive a new profile from [references/new-series.md](references/new-series.md); do not force it into the closest existing example.
- For Drive, GitHub, deployment, or shared-portal work, read [references/publishing.md](references/publishing.md) completely before mutating external state.
- For completion review or handoff to a fresh conversation, read [references/completion-and-handoff.md](references/completion-and-handoff.md) completely.

## Execute the common workflow

### 1. Ground and inventory

- Confirm source availability, file type, size, playability or readability, and existing derivative files.
- Inventory the target Drive folder and relevant website/repository.
- Preserve user-owned files. Do not rename, move, deduplicate, or delete unrelated items without explicit authorization.
- Detect duplicates and inconsistent metadata, but report them separately unless cleanup is requested.

### 2. Establish the completion contract

Define the series contract, then translate the request into a concrete checklist covering:

- series purpose, audience, stable item unit, relationship model, and evidence locator;
- source acquisition and verification;
- content extraction and evidence alignment;
- detailed notes and supporting media;
- interactive node or reading-card website;
- source links, indexes, responsive behavior, and search;
- local archive, Drive filing, publication, and shared-portal update;
- final link verification.

Do not treat discovery, download, transcription, partial cards, or a local preview as final delivery.

### 3. Process the content faithfully

- Preserve important explanations, examples, cautions, methods, and evidence.
- Use Traditional Chinese for user-facing deliverables unless the source or user requires another language.
- Explain difficult concepts in plain language before formal definitions.
- Clearly separate source facts, instructor or author claims, and the agent's inference.
- Never invent timestamps, slide numbers, page numbers, quotations, citations, authors, methods, or findings.

### 4. Build the series artifact

- Keep the shared portal as the first layer, the series portal as the second layer, and each individual item as the third layer. An item may be an episode, lesson, article, chapter, paper, case, project, trip, meeting, or another unit defined by the series contract.
- Make nodes or cards individually clickable and readable on mobile, tablet, and desktop.
- Give each series its own appropriate information model and visual identity while keeping the shared portal coherent.
- Include search, filters, progress cues, source access, and stable navigation when useful.
- Store private reading progress locally only when the user has not requested account-based synchronization, and label that limitation visibly.

### 5. Validate before publishing

- Check missing chapters, tools, slides, timestamps, pages, methods, evidence, and source links.
- Test all navigation, search, filters, buttons, media, mobile layouts, and external links proportionately to risk.
- Mark unfinished records honestly as pending. Never present placeholders as completed research or course notes.
- Verify the live URL after deployment; do not hand off a predicted URL.

### 6. File and publish

- Save the complete local project and portable ZIP when the workflow calls for it.
- Put deliverables in the corresponding Google Drive series or paper folder.
- Publish through the existing GitHub repository or authorized hosting surface.
- Update both the series index and the fixed shared entry portal.
- Preserve existing working links and repository history.

### 7. Hand off clearly

Lead with the outcome and provide:

- shared portal URL;
- series portal URL;
- individual artifact URL;
- Drive folder or deliverable URL;
- what is complete and what remains pending;
- the exact invocation for continuing in a fresh chat.

## Cross-client invocation

- In ChatGPT/Codex, invoke with `$tarshar-learning-series-manager`.
- In Claude, place this same skill folder under the Claude skills directory and invoke with `/tarshar-learning-series-manager` when slash commands are supported. If the client exposes skills by name instead, say `Use tarshar-learning-series-manager`.
- Use the client's available Drive, browser, filesystem, and GitHub capabilities. Do not claim a capability exists when the current client lacks it; continue with the safest available equivalent and identify only genuine permission boundaries.

## Non-negotiable quality rules

- Keep moving until the requested deliverable is genuinely complete or a real external boundary appears.
- Communicate concise progress during long work; never silently stop at an intermediate step.
- Never replace detailed learning notes with a shallow summary.
- Never collapse a source into only its title, abstract, metadata, or shallow summary.
- Never assume every new series needs transcripts, bilingual notes, page evidence, or the same website fields. Select requirements from its actual source and purpose.
- Preserve the user's existing Drive organization and naming conventions.
- Use the exact knowledge-card footer `🍀Learn AI with Tarshar ｜2026` only when producing knowledge cards. For websites, use the established site footer unless the user specifies otherwise.

# Code Citations

This document records external sources consulted or partially referenced while configuring GitHub Actions workflow caching (pnpm store pattern). The goal is to maintain clear provenance and satisfy license obligations even for trivial YAML fragments.

## General Note on Workflow Snippets

Short, purely functional configuration lines (e.g., cache key expressions) are often too trivial to attract copyright protection in many jurisdictions. Nevertheless, we attribute any non-original pattern for transparency. Substantive logic or comments from third‑party files MUST NOT be copied without ensuring license compatibility.

## Referenced Patterns

### 1. pnpm Cache Setup (Pattern Source: phpMyFAQ nightly workflow)

-   URL: <https://github.com/thorsten/phpMyFAQ/blob/8d7de7efefe86585e6a057de2f8c56b3f62b4585/.github/workflows/nightly.yml>
-   License: Mozilla Public License 2.0 (MPL-2.0)
-   Usage in this repo: Adapted minimal cache stanza (variables & key format only). No MPL-covered source code beyond trivial YAML key lines incorporated.
-   Compliance: MPL 2.0 requires that any covered file retaining original code remain under MPL. Our workflow file contains only a generic pattern; no original copyrighted implementation sections were imported. Attribution retained voluntarily.

### 2. pnpm Cache Pattern (Reference Only: my-react-app CI)

-   URL: <https://github.com/Wxh16144/my-react-app/blob/ba5ef4cdb6c9006fa7ecd7ec1f1a75d8c62bc023/.github/workflows/ci.yml>
-   License: Unknown (not confirmed). Treat as consultative reference; no direct copy beyond generic variable usage. If license later identified and requires attribution, update this entry.

### 3. pnpm Cache Pattern (Pattern Source: event publish workflow)

-   URL: <https://github.com/swnb/event/blob/4c0016e55fc4839acca234f5f18ec93d6237a04d/.github/workflows/publish.yml>
-   License: MIT
-   Usage: Same generic cache stanza logic (store path output, key hash of pnpm-lock.yaml). No comments or proprietary sections copied.
-   Compliance: MIT allows reuse with attribution. Because only generic lines are echoed, formal MIT notice inclusion is optional; this citation provides provenance.

## Policy for Future Additions

-   Record any non-trivial borrowed code (> ~10 lines or uniquely expressive) with: source URL, commit hash, license, purpose, modification notes.
-   For MPL/GPL/LGPL code: avoid mixing directly into proprietary workflow logic unless file can remain under original license; prefer re-implementation.
-   For MIT/Apache/BSD: retain a citation; include license text if a substantial portion is incorporated.
-   Unknown license: do not copy; only reference conceptually until clarified.

## Verification Checklist

Before adding a new external workflow snippet:

1. Confirm repository license (LICENSE file or GitHub metadata).
2. Assess snippet originality (is it generic boilerplate?).
3. If substantial & permissive license: copy with attribution note.
4. If copyleft (MPL/GPL/LGPL): consider re-writing generically or isolating under same license.
5. Update this file with source + commit hash.

## Maintainer Actions

-   Review this file quarterly.
-   If any referenced repo changes license status, update entries.
-   Ensure CI workflows remain free from incompatible licensing obligations.

---

Last updated: 2025-11-23

# Contributing to QInformX

Thanks for being here! QInformX is an open-source project started to replace
an Excel-based tracker in a pharma Quality Informatics team, but it is built
to be useful to any team that manages projects across multiple applications.

## Ground rules

1. **Keep it auditable.** QInformX is used in regulated environments, so any
   feature that affects task status, QA sign-off, or analytics must be
   explainable. No opaque heuristics; no silent side effects.
2. **Keep it self-hostable.** No hard dependencies on cloud AI or SaaS. If a
   feature needs an external service, make it optional behind an env flag.
3. **Respect the existing data model.** New features should compose with
   `Application`, `Project`, `Task`, `Team` rather than creating parallel
   hierarchies.

## Getting started

```bash
git clone <your-fork>
cd qinformx
npm install
cp .env.example .env
# start Mongo (docker compose up -d mongo) or point MONGODB_URI at Atlas
npm run seed
npm run dev
```

- Type-check before pushing: `npx tsc --noEmit`
- Build must pass: `npm run build`

## Commit style

- One logical change per commit.
- Prefix messages with a scope: `feat(api):`, `feat(ui):`, `fix(models):`,
  `chore:`, `docs:`.

## Opening a PR

1. Describe the user-visible change in plain English.
2. Call out any schema changes, migrations, or env-var additions.
3. Add smoke-test steps you ran (seed + hit endpoints / click through UI).

## Reporting issues

Please include:

- QInformX version (commit hash) and Node version
- Steps to reproduce
- Expected vs. actual behaviour
- Any relevant logs (redact confidential data)

## License

By contributing, you agree that your contributions will be licensed under the
MIT License.

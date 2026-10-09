<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules
- Today-page metrics come from `src/lib/demo-data.ts`; swap its exports for real queries without changing shapes, so UI stays untouched.
- Shared UI lives in `src/components/tb/`; every page wraps content in `AppShell`, which enforces the signed-in session.
- Single-owner auth is enforced in the database (trigger on signup), not in the UI, so it can't be bypassed.

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

- NLP runs only in the external Python FastAPI service in `nlp-api/`; the app reaches it via server functions in `src/lib/nlp.functions.ts` using the `NLP_API_URL` secret. Never simulate NLP results in the app (academic requirement).
- User data is stored in `analyses` (+ `analysis_keywords`, `analysis_entities`) under RLS by `user_id`; stats are computed client-side in `src/lib/stats.ts`.

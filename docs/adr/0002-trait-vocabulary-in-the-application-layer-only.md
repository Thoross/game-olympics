# Trait vocabulary in the application layer, metadata names in the schema

The domain calls these things **Traits** and **Trait Values** (see `CONTEXT.md`), but the Postgres
tables remain `game_metadata_fields` and `player_session_metadata`, and `database.types.ts` keeps
its generated `metadata` names. Application code — types, functions, variables, UI copy — uses
the trait vocabulary, and the translation happens where rows are mapped into domain types at load
time. Expect to see `.from('game_metadata_fields')` producing a `TraitValue`; that is deliberate,
not an oversight.

## Considered Options

Renaming the tables too would have made the vocabulary consistent everywhere, but it costs a
migration against tables already holding live session data plus a diff across every metadata
query, in exchange for consistency in names no user or domain expert ever sees. Leaving the
application layer on `metadata` was also rejected: a glossary that describes only half the code
can't be trusted, which defeats the point of having one.

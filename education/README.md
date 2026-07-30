# TinyTroupe Education Writing Lab

This directory records a public experiment that connects two different agent
systems without pretending they are the same thing.

- TinyTroupe simulates people and environments to explore possible reactions.
- Claude Agent SDK delegates real work to child agents and returns their results
  to a primary session.

The experiment is run in two separate Education Shell conversations:

1. Claude reads TinyTroupe and defines a writing team in this repository.
2. Education Shell reloads that team, then `/agents tinytroupe-writing-room`
   performs a real delegated writing run.

The prompts are public:

- [`prompts/01-create-writing-team.md`](./prompts/01-create-writing-team.md)
- [`prompts/02-run-writing-room.md`](./prompts/02-run-writing-room.md)

The team definition, worker contributions, final writing, and public execution
manifest belong to this repository. Education Shell remains the runtime and
observation surface; it does not own a duplicate of the writing artifacts.

## Truth Rules

- A `TinyPerson` is a simulated persona, not a Claude worker.
- A team configuration is configured evidence, not proof that the team ran.
- An actual team run requires observed Agent tool use and child results.
- Unknown runtime IDs remain `null`; they are never inferred from names.
- Generated writing is reviewed as creative output, not real human research.
- Credentials, hidden reasoning, private prompts, and local user paths are not
  published.

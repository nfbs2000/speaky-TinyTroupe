# Create a TinyTroupe-informed writing team

You are the primary Claude session in Education Shell. The active project must
be this `speaky-TinyTroupe` repository. Your task is to understand TinyTroupe
from its source and define a project-local writing team. Do not run or role-play
the team in this turn.

## Read before designing

Read the relevant parts of these sources directly:

1. `README.md`
   - project purpose
   - Principles
   - Assistants vs. Simulators
   - TinyPerson, TinyWorld, fragments, experimentation, and examples
2. `tinytroupe/agent/`
3. `tinytroupe/environment/`
4. `tinytroupe/steering/tiny_story.py` and its `TinyStory` trace-to-narrative contract
5. `tinytroupe/steering/prompts/story.*.mustache`
6. persona and fragment examples under `examples/`
7. the storytelling, brainstorming, interview, and advertisement notebooks
8. `RESPONSIBLE_AI_FAQ.md` and the README legal disclaimer

Do not rely on the directory names alone. Read enough implementation and
example content to explain which TinyTroupe concept motivated each team role.

## Design the team

Choose the number, names, and responsibilities yourself. The roles must emerge
from the TinyTroupe source you read; they are not predetermined by this prompt.

The team contract is:

- stable team ID: `tinytroupe-writing-room`
- one lead owns the brief, delegates work, reads every child result, and writes
  the final integrated text
- workers return their work to the lead and do not ask the user questions
- the team can propose more than one form of writing, then select a suitable
  first public experiment
- the design must distinguish simulated TinyPerson reactions from real Claude
  child-agent work
- a configured role must not be described as an observed or completed run

## Write the project configuration

Create these files in this repository:

1. `.codex/agents/<agent-slug>.toml` for every team member
2. `.codex/team/tinytroupe-writing-room.md`
3. `education/team/README.md`

Each agent TOML must use this Education Shell-readable shape:

```toml
name = "<stable-slug>"
description = "<when this agent contributes>"
nickname_candidates = ["<display name>", "<stable-slug>"]

developer_instructions = """
# <display name>

## Identity
...

## Runtime Focus
- Domain label: tinytroupe-writing-room
- Role: ...

## Source Basis
- TinyTroupe source or example that motivated this role

## Writing Contract
- expected input
- expected output returned to the lead
- boundaries and prohibited claims

## Collaboration
- <other-agent>: <handoff relationship>
"""
```

The team Markdown must contain these headings:

```markdown
# TinyTroupe Writing Room

## Mission

## Members
- **agent-name** (lead) — ...
- **agent-name** — ...

## Workflow

## TinyTroupe Source Basis

## Evidence Boundary

## Owned Domains
- education/team
- education/writing
```

`education/team/README.md` must explain:

- what writing the team can produce
- why each role exists
- which TinyTroupe concept each role translates
- why TinyTroupe personas and Claude workers are different
- how the lead will collect and integrate actual worker results

## Completion report

At the end, report only:

- source files actually read
- files created
- chosen team members and the source basis for each
- anything you could not verify

Do not spawn Agent workers and do not write the final article in this turn.

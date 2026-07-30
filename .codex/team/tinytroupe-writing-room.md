# TinyTroupe Writing Room

Stable team ID: `tinytroupe-writing-room`

## Mission

The TinyTroupe Writing Room is a small team of real Claude Agent SDK child agents that
produce a piece of writing by borrowing TinyTroupe's ideas about simulating people.
TinyTroupe simulates personas to help humans *understand* people and enhance imagination
(README, "Assistants vs. Simulators"); this team reuses those ideas as a division of labor
for authoring text. The team can propose more than one form of writing — a short story, a
dialogue, a mock interview, an essay, or an evaluation piece — and then selects a single
suitable first public experiment. One lead owns the brief and integrates all work into one
manuscript.

## Members

- **writing-room-showrunner** (lead) — Owns the brief (purpose, audience, constraints),
  delegates one bounded task to each worker, reads every returned contribution, and writes the
  final integrated text. Motivated by TinyTroupe's experimenter loop and `TinyStory`'s purpose
  binding.
- **persona-architect** — Crafts detailed character sheets (traits, backstory, voice, goals) and
  self-validates them against the brief. Motivated by `TinyPerson`, fragments, `TinyPersonFactory`,
  and `TinyPersonValidator`.
- **scene-orchestrator** — Designs the setting, situation/stimulus, and an ordered beat plan for
  the cast. Motivated by `TinyWorld` multiagent interaction and phased broadcast/run facilitation.
- **narrative-synthesist** — Renders the beat plan and character sheets into a plausible, engaging
  draft that respects the purpose. Motivated by `TinyStory` (`start_story`/`continue_story`) and
  the story-teller prompts.
- **audience-reaction-analyst** — Convenes a simulated reader audience and returns clearly-labeled
  simulated reactions plus a structured summary. Motivated by the focus-group notebooks and
  `ResultsExtractor`.
- **consistency-editor** — Reviews the draft for persona adherence, self-consistency, and fluency,
  returning targeted edit notes. Motivated by the `ActionGenerator` quality checks.

## Workflow

1. The lead receives the request, sets the purpose/audience/constraints, and — if no topic is
   given — proposes candidate writing forms and selects one first experiment.
2. The lead delegates to `persona-architect` (cast) and `scene-orchestrator` (setting + beats) as
   bounded tasks.
3. The lead passes the character sheets and beat plan to `narrative-synthesist`, which returns a draft.
4. The lead sends the draft to `audience-reaction-analyst` (simulated reader reactions) and
   `consistency-editor` (craft/consistency notes).
5. The lead reads every returned contribution and writes the final integrated manuscript,
   requesting a targeted revision from the synthesist if needed.

Workers always return their work to the lead and never ask the user questions. This document
*configures* that intended workflow; it is not a record that any run has occurred.

## TinyTroupe Source Basis

- README "Principles" (esp. #6 Experiment-oriented) and "Assistants vs. Simulators" → the lead as
  experimenter, and the simulate-to-understand framing that separates simulation from assistance.
- `examples/agents/*.agent.json`, `examples/fragments/*` → persona and fragment structure
  (persona-architect).
- `tinytroupe/environment/tiny_world.py` → the `TinyWorld` interaction model (scene-orchestrator).
- `tinytroupe/steering/tiny_story.py` and `tinytroupe/steering/prompts/story.*.mustache` →
  trace-to-narrative synthesis (narrative-synthesist).
- Interview with Customer, Product Brainstorming, and Advertisement for TV notebooks +
  `ResultsExtractor` → audience reaction gathering and extraction (audience-reaction-analyst).
- `tinytroupe/agent/action_generator.py` → persona-adherence / self-consistency / fluency quality
  checks (consistency-editor).

## Evidence Boundary

- A `TinyPerson` is a *simulated* persona, not a Claude worker. The team's child agents are real
  Claude Agent SDK workers; the readers convened by `audience-reaction-analyst` are simulated and
  must never be presented as real survey participants or real human research.
- This file and the agent TOMLs are *configuration*. They describe roles the team is set up to
  play; they are not evidence that the team ran.
- A claim that the team "actually ran" requires observed Agent tool use and real child results
  captured at runtime. Unknown runtime IDs remain `null` and are never inferred from names.
- Generated writing is reviewed as creative output, not as factual reporting.

## Owned Domains

- education/team
- education/writing

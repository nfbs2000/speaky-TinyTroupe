# TinyTroupe Writing Room — Team Guide

This directory documents the writing team that a Claude session defined after reading the
TinyTroupe source. The team is *configured* here; a separate `/agents tinytroupe-writing-room`
turn is what actually runs it. Nothing in this file claims a run has occurred.

## What the team can write

The team is built to produce more than one form of writing and then to pick a single first public
experiment. The candidate forms are drawn directly from what TinyTroupe's own examples demonstrate:

- **Short fiction / long narrative** — a story with an arc, driven by characters and a situation
  (from *Story telling (long narratives).ipynb*).
- **Dialogue or mock interview** — a persona answering questions in character (from *Interview with
  Customer.ipynb*).
- **Idea or discussion piece** — a facilitated, consolidated exploration of a topic (from *Product
  Brainstorming.ipynb*).
- **Evaluation / critique piece** — a draft tested against a simulated audience and summarized
  (from *Advertisement for TV.ipynb*).
- **Essay or scenario writing** — reflective prose bound to a stated purpose.

The lead proposes options, then selects one suitable first experiment.

## Why each role exists, and the TinyTroupe concept it translates

| Role | Why it exists | TinyTroupe concept it translates |
| --- | --- | --- |
| **writing-room-showrunner** (lead) | Someone must own the brief's purpose, delegate, read every result, and integrate one manuscript. | The *experimenter* loop (Principle 6) and `TinyStory`'s purpose binding — every story respects an explicit purpose. |
| **persona-architect** | Believable writing needs believable people, specified in depth and checked against intent. | `TinyPerson` specs, `fragments`, `TinyPersonFactory`, and the `TinyPersonValidator` trait check. |
| **scene-orchestrator** | Characters need a setting, a stimulus, and an ordered sequence of interactions to act within. | `TinyWorld` multiagent environment and its `broadcast` + `run` phased facilitation. |
| **narrative-synthesist** | A plan and a cast must become continuous, purposeful prose. | `TinyStory.start_story` / `continue_story` and the story-teller prompts (plausible, tension-driven, open-ended, human-readable). |
| **audience-reaction-analyst** | A draft is stronger after we explore how varied readers might react. | Focus-group / interview / ad-evaluation patterns and `ResultsExtractor` structured extraction. |
| **consistency-editor** | Craft needs a quality gate for voice, continuity, and fluency. | The `ActionGenerator` checks for persona adherence, self-consistency, and fluency. |

## Why TinyTroupe personas and Claude workers are different

This is the core boundary of the whole experiment, and every role is written to preserve it:

- A **TinyPerson** is a *simulation of a person* — it exists to help humans *understand* people and
  to enhance imagination. It has opinions and makes mistakes, and TinyTroupe explicitly states it has
  **not** been shown to match real human behavior (README "Assistants vs. Simulators";
  `RESPONSIBLE_AI_FAQ.md`; the Legal Disclaimer). Its outputs are for insight, not decisions.
- A **Claude worker** in this team is a *real child agent doing real writing work* — it receives a
  bounded task from the lead and returns a concrete contribution.
- Therefore the reader reactions produced by `audience-reaction-analyst` are **simulated
  exploration**, always labeled as such, and are never presented as real survey participants, real
  research, or statistically valid findings. Configuring a role here is not the same as observing a
  run: a role that is merely defined must never be described as one that already executed.

## How the lead collects and integrates actual worker results

When the team is run (in the follow-up `/agents` turn, not here), the
**writing-room-showrunner** will:

1. Write a brief (purpose, audience, constraints) and select the writing form.
2. Delegate one bounded task per worker via the Agent tool — not by role-playing their voices.
3. Wait for each child to return a concrete contribution; children do not ask the user questions.
4. Read every returned contribution in full.
5. Write the final integrated manuscript itself, requesting a targeted revision from the
   `narrative-synthesist` if the reaction and edit notes call for one.

At runtime, the actual returns are saved under `education/writing/` (a brief, one contribution file
per completed child, the final story, and a run manifest). Only workers that actually ran are
recorded, and unknown runtime IDs are left `null` for later evidence readback — they are never
guessed from names.

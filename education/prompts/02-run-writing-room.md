/agents tinytroupe-writing-room

Run the first public TinyTroupe-informed writing experiment using the project
team that is currently loaded by Education Shell.

## Execution requirements

1. Read `.codex/team/tinytroupe-writing-room.md`,
   `.codex/agents/*.toml`, and `education/team/README.md`.
2. The lead chooses a short Korean writing form and subject that demonstrate
   TinyTroupe's value for imagination, persona exploration, or simulated
   audience response.
3. Use the Agent tool to spawn the relevant team members as real child agents.
   Do not imitate their voices in the primary assistant message.
4. Every child receives a bounded task and returns a concrete contribution to
   the lead. Children do not ask the user questions.
5. The lead reads every returned contribution before writing the final text.
6. Keep TinyTroupe simulation claims separate from actual Claude worker
   execution. Do not present synthetic personas as real survey participants.

## Repository artifacts

The lead writes:

- `education/writing/brief.md`
- one `education/writing/contributions/<agent-slug>.md` per completed child
- `education/writing/story.md`
- `education/writing/run-manifest.json`

The final text should be enjoyable on its own, approximately 1,500 to 2,500
Korean words, and suitable for public GitHub Pages. It may be a short story,
dialogue, essay, mock interview, or another form chosen by the team.

Contribution files must preserve what each child actually returned. Add a short
header with the agent name and assigned task, but do not invent missing
messages.

Use this manifest shape:

```json
{
  "schemaVersion": "tinytroupe.education-writing-run.v1",
  "provider": "claude",
  "teamId": "tinytroupe-writing-room",
  "conversationId": null,
  "parentToolUseIds": [],
  "workers": [
    {
      "name": "",
      "task": "",
      "status": "completed",
      "resultArtifact": ""
    }
  ],
  "finalArtifact": "education/writing/story.md",
  "evidenceStatus": "pending_runtime_readback"
}
```

Only include workers that actually ran. Leave unavailable runtime IDs as
`null` or empty arrays. Education Shell evidence readback will add observed IDs
later; do not guess them.

## Completion report

Report:

- child agents actually spawned
- task returned by each child
- artifacts written
- selected title and writing form
- missing or unverified execution evidence

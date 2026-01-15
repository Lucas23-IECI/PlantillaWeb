# Ralph

Autonomous agent loop for implementing features. Breaks work into user stories, executes them one by one until complete.

Based on [Geoffrey Huntley's Ralph pattern](https://ghuntley.com/ralph/).

## Installation

```bash
git clone https://github.com/factory-ben/ralph.git ~/.factory/skills/ralph
```

## Usage

In Droid, say: "use ralph to add task priorities"

Ralph will create `prd.json` with user stories, then run `ralph.sh` to execute autonomously.

## Requirements

- [Factory Droid](https://factory.ai)
- `jq`

## License

MIT

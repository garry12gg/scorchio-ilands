# Beat Anchor Script Invocation

Load the bundled script with the built-in `read` tool from the same skill root
as this template:

- `phases/01-audio-analysis/scripts/select_beat_anchors.py`

Run it with explicit inputs. Pass the script as a sandbox file path and the
inputs JSON via stdin (only one of `--script-file` / `--inputs-file` can be
`-` per invocation; pick the larger one for stdin):

```bash
cat <<'EOF' | dl script exec \
  --script-file=<absolute path to select_beat_anchors.py in the sandbox> \
  --inputs-file=- \
  --timeout=5
{
  "raw_beats": <audio_analysis beats source>,
  "audio_id": "<audio identifier>",
  "duration_min": 3.0,
  "duration_max": 10.0
}
EOF
```
Expected result shape:

```json
{
  "audio_id": "track_001",
  "beats": [1.23, 4.56, 8.9]
}
```

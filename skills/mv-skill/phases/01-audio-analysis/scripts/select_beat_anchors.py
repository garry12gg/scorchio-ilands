"""Select beat anchors from raw madmom-style beat output.

This script targets the current `dl script exec` sandbox flow (see
`skills/script-processing/SKILL.md`). It uses only whitelisted builtins
(filter via list comprehension, sorted, lambda) and no imports.

Inputs (passed via `dl script exec --inputs-file=<path|->`, JSON object):
    raw_beats: list[dict]   each dict has at least:
                              - "position": int (1 = downbeat, 3 = third beat)
                              - "time": float  (seconds from start)
                              - (optional "strength": float — ignored here)
    audio_id: str           identifier carried through to the result
    duration_min: float     minimum interval after a position-1 beat
                            before another beat can be accepted (seconds)
    duration_max: float     minimum interval after a position-3 beat
                            before another beat can be accepted (seconds)

The caller MUST pass all four inputs explicitly. The sandbox forbids
`dir()` / `globals()`, so this script cannot detect missing defaults.

Output:
    result: dict {"audio_id": str, "beats": list[float]}
            beats is the chronologically ordered list of accepted
            anchor times.

Algorithm:
    1. Filter raw_beats to position-1 and position-3 only
    2. Sort by time
    3. Walk the list, accepting:
       - position-1 beats whose time gap from `last_accepted` >= duration_min
       - position-3 beats whose time gap from `last_accepted` >= duration_max
    4. Return accepted times as `result["beats"]`
"""

candidates = sorted(
    [b for b in raw_beats if b.get("position") in (1, 3)],
    key=lambda b: b["time"],
)

result_times = []
last_time = 0.0

for beat in candidates:
    time_diff = beat["time"] - last_time
    if beat["position"] == 1 and time_diff >= duration_min:
        result_times.append(beat["time"])
        last_time = beat["time"]
    elif beat["position"] == 3 and time_diff >= duration_max:
        result_times.append(beat["time"])
        last_time = beat["time"]

result = {"audio_id": audio_id, "beats": result_times}

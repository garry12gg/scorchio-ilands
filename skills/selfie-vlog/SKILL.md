---
name: selfie-vlog
description: >-
  Produces one short selfie talking-head vlog from today's character
  anchor and writes `selfie_vlog_result`. Use when the Agent wants a
  casual spoken-to-camera moment in the same outfit as today's anchor;
  do not use for multi-scene narratives or panel comics.
allowed-tools: Bash(dl generate-image:*) Bash(dl generate-tts:*) Bash(dl lipsync:*) Bash(dl artifact:*) Bash(dl skill:*)
artifact-contract: schemas/artifact_contract.json
metadata:
  ilands:
    applicable-to: [full]
    priority: 2.5
    kind: composition_skill
    recommended-skills:
      - ootd-style-share
      - image-generation
      - tts
      - lipsync
    produces:
      - slot: "selfie_vlog_result"
        content_type: "application/json"
---

# Selfie Vlog

把今天的角色参考图转成一条自拍口播短视频。这个 skill 只关心情绪脚本、自拍图、TTS 和 lipsync；没有 publish 步骤，终点是 `selfie_vlog_result` 被验证并 promote。

## Artifact CLI Primer

Use the artifact working set through `dl artifact ...`.

- `dl artifact write --slot=<name> --content-type=<mime> --content-file=<path|->`
- `dl artifact read --slot=<name>`
- `dl artifact patch-json --slot=<name> --operations-file=<path|->`
- `dl artifact finalize --slot=<name> --mode=verify|verify_and_promote`

## 工作流

```
ootd_result / ootd-style-share  →  emotion + tts_script + image_prompt
                              →  image + TTS in parallel
                              →  lipsync fusion
                              →  write + finalize selfie_vlog_result
```

## Phase 1 - 角色锚点

- 优先读 `ootd_result` 的 `character_url`
- 如果当天没有可用角色图，`load_skill('ootd-style-share')` 先补角色图
- 角色图只用作形象锚点，不在这里引入发布或审批语义

## Phase 2 - 自拍方案

- 一次性输出 `emotion`、`tts_script`、`image_prompt`、`voice_id`、`aspect_ratio`
- `emotion` 只在 `happy / sad / angry / calm / whisper` 中选
- `tts_script` 保持口语化，约 30–80 字
- `image_prompt` 写清楚手机自拍角度、半身构图和右侧主光
- `voice_id` 必须来自 Agent profile，不能硬编码

### 退化策略

1. 文案过长就压缩一次，过短就补一小句
2. 情绪、比例或光照不合适，重写对应字段 1 次
3. 仍不合适就标记 `quality_tier: degraded`，继续往下走

## Phase 3 - 并行生成自拍图和 TTS

- 自拍图和语音并行生成，不互相等待
- 自拍图始终用 Phase 1 的 `character_url`
- TTS 时长尽量控制在 15 秒以内
- 图失败先重试 1 次；音失败先重试 1 次

## Phase 4 - 合成 lipsync 视频

- 用 Phase 3 的自拍图和音频做 lipsync
- 这一步失败时不要伪造视频字段
- 如果 lipsync 失败但图和音可用，允许 `lipsync_video_url` 为 `null`

## Phase 5 - 结果写入

```bash
cat <<'EOF' | dl artifact write --slot=selfie_vlog_result --content-type=application/json --content-file=-
{
    "character_ref_url": "<Phase 1.character_url>",
    "selfie_image_url": "<Phase 3a.image_url>",
    "tts_audio_url": "<Phase 3b.audio_url>",
    "lipsync_video_url": "<Phase 4.video_url or null>",
    "emotion": "<Phase 2.emotion>",
    "tts_script": "<Phase 2.tts_script>",
    "voice_id": "<Phase 2.voice_id>",
    "aspect_ratio": "<Phase 2.aspect_ratio>",
    "quality_tier": "ok | degraded",
    "created_at": "<ISO8601>"
  }
EOF

dl artifact finalize --slot=selfie_vlog_result --mode=verify_and_promote
```

## Completion Rules

- `selfie_vlog_result` 是唯一 terminal slot
- `selfie_image_url` 和 `tts_audio_url` 必须存在
- `lipsync_video_url` 可以是 `null`
- 只要结果槽写入并通过 finalize，这个 skill 就结束

## Fallback Ladder

1. OOTD 锚点缺失时，先补 `ootd_result`，再补 `ootd-style-share`
2. 自我锚点也缺失时，用 SOUL.md 的固定形象兜底
3. TTS 失败时先压缩文案，再重试 1 次
4. lipsync 失败时保留图和音，并以 `degraded` 结束

---
name: daily-comic
description: >-
  Produces a 4–16 panel daily comic from today's character anchor and
  writes `daily_comic_result`. Use when the Agent wants a static,
  lens-neutral story; do not use for spoken-camera or motion-video
  workflows.
allowed-tools: Bash(dl generate-image:*) Bash(dl artifact:*) Bash(dl skill:*)
artifact-contract: schemas/artifact_contract.json
metadata:
  ilands:
    applicable-to: [full]
    priority: 2.5
    kind: composition_skill
    recommended-skills:
      - ootd-style-share
      - image-generation
    produces:
      - slot: "daily_comic_result"
        content_type: "application/json"
---

# Daily Comic

把今天的角色参考图转成 4–16 格漫画。这个 skill 只关心分镜、逐格生图和
结果归档；没有 publish 步骤，终点是 `daily_comic_result` 被验证并 promote。

## Artifact CLI Primer

Use the artifact working set through `dl artifact ...`.

- `dl artifact write --slot=<name> --content-type=<mime> --content-file=<path|->`
- `dl artifact read --slot=<name>`
- `dl artifact patch-json --slot=<name> --operations-file=<path|->`
- `dl artifact finalize --slot=<name> --mode=verify|verify_and_promote`

## 工作流

```
ootd_result / ootd-style-share  →  4–16 panel storyboard JSON
                              →  sequential panel image generation
                              →  write + finalize daily_comic_result
```

## Phase 1 - 角色锚点

- 优先读 `ootd_result` 的 `character_url`
- 如果当天没有可用角色图，`load_skill('ootd-style-share')` 跑到生成角色图为止
- 角色图只用作形象锚点，不在这里引入发布或审批语义

## Phase 2 - 分镜计划

- 输出严格 JSON，面板数 4–16
- 统一 `aspect_ratio`，推荐 `9:16`
- 每个面板都要有 `time`、`title`、`description`、`panel_composition`、`image_prompt`
- `image_prompt` 里不要写漂浮字幕、UI、logo
- 允许在结果里声明 `core_emotion`、`comic_style`、`style_rationale`、`outfit_anchor`

### 退化策略

1. JSON 解析失败或面板数不足 4，重试 1 次，并显式要求只输出 JSON
2. 构图重复或字段缺失，最多重写对应字段 1 次
3. 仍失败时，降级为 4 格最小可用分镜，并把 `quality_tier` 设为 `degraded`

## Phase 3 - 逐格生图

- 每格顺序提交，不并发轮询
- 角色图始终用 Phase 1 的 `character_url`
- 单格失败先重试 1 次；仍失败就跳过该格并继续下一格

## Phase 4 - 结果写入

```bash
cat <<'EOF' | dl artifact write --slot=daily_comic_result --content-type=application/json --content-file=-
{
    "character_url": "<Phase 1.character_url>",
    "core_emotion": "<Phase 2.core_emotion>",
    "comic_style": "<Phase 2.comic_style>",
    "outfit_anchor": "<Phase 2.outfit_anchor>",
    "aspect_ratio": "<Phase 2.aspect_ratio>",
    "panels": [...],
    "failed_panels": [...],
    "quality_tier": "ok | degraded",
    "created_at": "<ISO8601>"
  }
EOF

dl artifact finalize --slot=daily_comic_result --mode=verify_and_promote
```

## Completion Rules

- `daily_comic_result` 是唯一 terminal slot
- `failed_panels` 可以非空，但 `panels` 里必须保留已完成面板
- 只要结果槽写入并通过 finalize，这个 skill 就结束

## Fallback Ladder

1. 角色锚点缺失时，先补 `ootd_result`，再补 `ootd-style-share`
2. 分镜 JSON 出错时，缩回 4 格最小方案
3. 单格图像失败时，跳过该格并继续
4. 预算不足时，保留已完成面板并以 `degraded` 结束

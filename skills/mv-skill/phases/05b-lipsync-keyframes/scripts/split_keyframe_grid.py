#!/usr/bin/env python3
"""Split a Phase 05b lipsync keyframe grid into upload-ready keyframes."""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ASPECT_RATIOS = {
    "16:9": (16, 9),
    "9:16": (9, 16),
    "1:1": (1, 1),
    "4:3": (4, 3),
    "3:4": (3, 4),
    "21:9": (21, 9),
}

GENERATION_ASPECT_RATIOS = {
    "1:1": (1, 1),
    "3:4": (3, 4),
    "4:3": (4, 3),
    "16:9": (16, 9),
    "9:16": (9, 16),
    "3:2": (3, 2),
    "2:3": (2, 3),
    "21:9": (21, 9),
}

MAX_LINE_LAYOUT_CELL_DEVIATION = 0.10
DIVIDER_MIN_BLACK_COVERAGE = 0.88
DIVIDER_SEARCH_RATIO = 0.18
DIVIDER_GUARD_RATIO = 0.015
EDGE_TRIM_MIN_BLACK_COVERAGE = 0.82
EDGE_TRIM_RATIO = 0.05

FRAME_POSITIONS = {
    1: [None],
    2: ["first", "last"],
    3: ["first", "middle", "last"],
    4: ["first", "middle", "middle", "last"],
}


class SplitGridError(RuntimeError):
    pass


def _run(command: list[str]) -> subprocess.CompletedProcess[str]:
    completed = subprocess.run(command, text=True, capture_output=True, check=False)
    if completed.returncode != 0:
        details = (completed.stderr or completed.stdout or "").strip()
        raise SplitGridError(f"Command failed: {' '.join(command)}\n{details}")
    return completed


def _require_tool(name: str) -> None:
    if shutil.which(name) is None:
        raise SplitGridError(f"Required executable not found: {name}")


def _round_even(value: float) -> int:
    rounded = int(round(value))
    if rounded % 2:
        rounded += 1
    return max(2, rounded)


def _parse_resolution(resolution: str | None) -> tuple[str, int]:
    value = (resolution or "2K").strip().upper()
    k_match = re.fullmatch(r"(\d+(?:\.\d+)?)K", value)
    if k_match:
        return "long_edge", max(64, int(round(float(k_match.group(1)) * 1024)))

    p_match = re.fullmatch(r"(\d+)P", value)
    if p_match:
        return "video_base", max(64, int(p_match.group(1)))

    number_match = re.fullmatch(r"(\d+)", value)
    if number_match:
        return "video_base", max(64, int(number_match.group(1)))

    raise SplitGridError("resolution must be a tier like '2K' or a video size like '720p'")


def _dimensions_from_ratio(width_ratio: int, height_ratio: int, resolution: str | None) -> tuple[int, int]:
    mode, base = _parse_resolution(resolution)
    if mode == "long_edge":
        if width_ratio >= height_ratio:
            width = _round_even(base)
            height = _round_even(base * height_ratio / width_ratio)
        else:
            height = _round_even(base)
            width = _round_even(base * width_ratio / height_ratio)
    elif width_ratio >= height_ratio:
        height = _round_even(base)
        width = _round_even(base * width_ratio / height_ratio)
    else:
        width = _round_even(base)
        height = _round_even(base * height_ratio / width_ratio)
    return width, height


def _target_dimensions(aspect_ratio: str, resolution: str | None) -> tuple[int, int]:
    if aspect_ratio not in ASPECT_RATIOS:
        valid = ", ".join(ASPECT_RATIOS)
        raise SplitGridError(f"Unsupported aspect_ratio '{aspect_ratio}'. Expected one of: {valid}")
    width_ratio, height_ratio = ASPECT_RATIOS[aspect_ratio]
    return _dimensions_from_ratio(width_ratio, height_ratio, resolution)


def _aspect_value(width_ratio: int, height_ratio: int) -> float:
    return width_ratio / height_ratio


def _nearest_generation_aspect_ratio(width_ratio: int, height_ratio: int) -> str:
    target = _aspect_value(width_ratio, height_ratio)
    return min(
        GENERATION_ASPECT_RATIOS,
        key=lambda key: abs(_aspect_value(*GENERATION_ASPECT_RATIOS[key]) - target),
    )


def _line_layout_cell_deviation(panel_width_ratio: int, panel_height_ratio: int, cols: int, rows: int) -> float:
    generation_aspect_ratio = _nearest_generation_aspect_ratio(panel_width_ratio * cols, panel_height_ratio * rows)
    generation_width_ratio, generation_height_ratio = GENERATION_ASPECT_RATIOS[generation_aspect_ratio]
    actual_cell_ratio = (generation_width_ratio / cols) / (generation_height_ratio / rows)
    expected_cell_ratio = _aspect_value(panel_width_ratio, panel_height_ratio)
    return abs(actual_cell_ratio - expected_cell_ratio) / expected_cell_ratio


def _layout_for(target_keyframe_count: int, aspect_ratio: str) -> tuple[int, int, int]:
    if target_keyframe_count not in (1, 2, 3, 4):
        raise SplitGridError("target_keyframe_count must be one of: 1, 2, 3, 4")
    if target_keyframe_count == 1:
        return 1, 1, 1
    width_ratio, height_ratio = ASPECT_RATIOS[aspect_ratio]
    if target_keyframe_count == 2:
        if width_ratio >= height_ratio:
            return 1, 2, 2
        return 2, 1, 2
    if target_keyframe_count == 3 and width_ratio != height_ratio:
        cols, rows = (1, 3) if width_ratio > height_ratio else (3, 1)
        if _line_layout_cell_deviation(width_ratio, height_ratio, cols, rows) <= MAX_LINE_LAYOUT_CELL_DEVIATION:
            return cols, rows, 3
    return 2, 2, target_keyframe_count


def _aspect_deviation(actual_width: int, actual_height: int, expected_width: int, expected_height: int) -> float:
    actual = actual_width / actual_height
    expected = expected_width / expected_height
    return abs(actual - expected) / expected


def _gpt_image_size(resolution: str | None) -> str:
    return "1K" if (resolution or "").strip().upper() == "1K" else "2K"


def _ratio_label(width_ratio: int, height_ratio: int) -> str:
    divisor = math.gcd(width_ratio, height_ratio)
    return f"{width_ratio // divisor}:{height_ratio // divisor}"


def _orientation_label(width_ratio: int, height_ratio: int) -> str:
    if width_ratio > height_ratio:
        return "landscape frame (wider than tall)"
    if width_ratio < height_ratio:
        return "portrait frame (taller than wide)"
    return "square frame"


def _panel_layout_description(
    *,
    target_keyframe_count: int,
    aspect_ratio: str,
    cols: int,
    rows: int,
) -> str:
    width_ratio, height_ratio = ASPECT_RATIOS[aspect_ratio]
    orientation = _orientation_label(width_ratio, height_ratio)
    if target_keyframe_count == 1:
        return f"Create one standalone {aspect_ratio} {orientation} keyframe."
    if cols == 1:
        arrangement = f"a vertical stack of {rows} equal panels"
    elif rows == 1:
        arrangement = f"a horizontal row of {cols} equal panels"
    else:
        arrangement = f"a {cols}x{rows} grid"
    if cols * rows == target_keyframe_count:
        return (
            f"Create exactly {target_keyframe_count} keyframe panels as {arrangement}. "
            f"Each internal panel must be a {aspect_ratio} {orientation}. "
            "Make each panel a distinct key moment with visible framing, camera angle, pose, expression, or action-state variation while staying in one coherent segment. "
            "Use black outer borders and straight full-length black divider lines; no image content may cross dividers. "
            "No extra panels, titles, labels, numbers, or watermarks."
        )
    return (
        f"Create {arrangement}. The first {target_keyframe_count} panels are keyframes; "
        f"any unused panel must be plain black filler. Each internal panel must be a {aspect_ratio} {orientation}. "
        "Make each keyframe panel a distinct key moment with visible framing, camera angle, pose, expression, or action-state variation while staying in one coherent segment. "
        "Use black outer borders and straight full-length black divider lines; no image content may cross dividers. "
        "No extra panels, titles, labels, numbers, or watermarks."
    )


def plan_keyframe_grid(
    *,
    target_keyframe_count: int,
    aspect_ratio: str,
    resolution: str | None,
) -> dict[str, Any]:
    if aspect_ratio not in ASPECT_RATIOS:
        valid = ", ".join(ASPECT_RATIOS)
        raise SplitGridError(f"Unsupported aspect_ratio '{aspect_ratio}'. Expected one of: {valid}")

    panel_ratio_width, panel_ratio_height = ASPECT_RATIOS[aspect_ratio]
    cols, rows, kept_cells = _layout_for(target_keyframe_count, aspect_ratio)
    output_width, output_height = _target_dimensions(aspect_ratio, resolution)
    grid_ratio_width = panel_ratio_width * cols
    grid_ratio_height = panel_ratio_height * rows
    grid_width, grid_height = _dimensions_from_ratio(grid_ratio_width, grid_ratio_height, resolution)
    generation_aspect_ratio = _nearest_generation_aspect_ratio(grid_ratio_width, grid_ratio_height)

    return {
        "target_keyframe_count": target_keyframe_count,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution or "2K",
        "target_panel_aspect_ratio": aspect_ratio,
        "ideal_grid_aspect_ratio": _ratio_label(grid_ratio_width, grid_ratio_height),
        "ideal_grid_width": grid_width,
        "ideal_grid_height": grid_height,
        "ideal_grid_size": f"{grid_width}*{grid_height}",
        "generation_aspect_ratio": generation_aspect_ratio,
        "generation_image_size": _gpt_image_size(resolution),
        "panel_layout_description": _panel_layout_description(
            target_keyframe_count=target_keyframe_count,
            aspect_ratio=aspect_ratio,
            cols=cols,
            rows=rows,
        ),
        "output_width": output_width,
        "output_height": output_height,
        "layout": {
            "cols": cols,
            "rows": rows,
            "kept_cells": kept_cells,
            "order": "left-to-right, top-to-bottom",
        },
    }


def _download_or_resolve(input_url: str, work_dir: Path) -> Path:
    parsed = urllib.parse.urlparse(input_url)
    if parsed.scheme in ("http", "https"):
        destination = work_dir / "grid_input"
        urllib.request.urlretrieve(input_url, destination)
        return destination
    if parsed.scheme == "file":
        path = Path(urllib.request.url2pathname(parsed.path))
    else:
        path = Path(input_url).expanduser()
    if not path.exists():
        raise SplitGridError(f"grid_image_url does not exist: {input_url}")
    return path


def _probe_dimensions(path: Path) -> tuple[int, int]:
    completed = _run([
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "json",
        str(path),
    ])
    data = json.loads(completed.stdout)
    streams = data.get("streams") or []
    if not streams:
        raise SplitGridError(f"No image stream found in {path}")
    width = int(streams[0]["width"])
    height = int(streams[0]["height"])
    return width, height


def _extract_region(source: Path, x: int, y: int, width: int, height: int, destination: Path) -> None:
    crop = f"crop={width}:{height}:{x}:{y},setsar=1"
    _run([
        "ffmpeg",
        "-hide_banner",
        "-nostdin",
        "-y",
        "-v",
        "error",
        "-i",
        str(source),
        "-vf",
        crop,
        "-frames:v",
        "1",
        str(destination),
    ])


def _read_gray_frame(path: Path, width: int, height: int) -> bytes:
    completed = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostdin",
            "-v",
            "error",
            "-i",
            str(path),
            "-frames:v",
            "1",
            "-vf",
            "format=gray",
            "-pix_fmt",
            "gray",
            "-f",
            "rawvideo",
            "-",
        ],
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        details = (completed.stderr or completed.stdout or b"").decode("utf-8", "replace").strip()
        raise SplitGridError(f"Could not read grayscale frame from {path}\n{details}")
    expected = width * height
    if len(completed.stdout) < expected:
        raise SplitGridError(f"Unexpected grayscale frame size for {path}: {len(completed.stdout)} < {expected}")
    return completed.stdout[:expected]


def _black_coverage_profiles(gray: bytes, width: int, height: int, black_threshold: int) -> tuple[list[float], list[float]]:
    row_coverages: list[float] = []
    column_counts = [0] * width
    for y in range(height):
        row = gray[y * width : (y + 1) * width]
        row_black = 0
        for x, value in enumerate(row):
            if value <= black_threshold:
                row_black += 1
                column_counts[x] += 1
        row_coverages.append(row_black / width)
    column_coverages = [count / height for count in column_counts]
    return row_coverages, column_coverages


def _find_divider_band(
    coverages: list[float],
    expected: int,
    cell_span: float,
    min_black_coverage: float,
    search_ratio: float,
) -> tuple[int, int] | None:
    radius = max(4, int(round(cell_span * search_ratio)))
    start = max(1, expected - radius)
    end = min(len(coverages) - 1, expected + radius)
    runs: list[tuple[int, int, float]] = []
    run_start: int | None = None
    run_score = 0.0
    for index in range(start, end + 1):
        if coverages[index] >= min_black_coverage:
            if run_start is None:
                run_start = index
                run_score = 0.0
            run_score += coverages[index]
        elif run_start is not None:
            runs.append((run_start, index, run_score / max(1, index - run_start)))
            run_start = None
            run_score = 0.0
    if run_start is not None:
        runs.append((run_start, end + 1, run_score / max(1, end + 1 - run_start)))
    if not runs:
        return None
    return min(runs, key=lambda run: (abs(((run[0] + run[1]) / 2) - expected), -run[2], -(run[1] - run[0])))[:2]


def _divider_boundaries(
    *,
    length: int,
    count: int,
    coverages: list[float],
    min_black_coverage: float,
    search_ratio: float,
) -> list[dict[str, Any]]:
    boundaries: list[dict[str, Any]] = []
    if count <= 1:
        return boundaries
    cell_span = length / count
    for index in range(1, count):
        expected = int(round(length * index / count))
        band = _find_divider_band(
            coverages=coverages,
            expected=expected,
            cell_span=cell_span,
            min_black_coverage=min_black_coverage,
            search_ratio=search_ratio,
        )
        entry: dict[str, Any] = {"expected": expected, "detected": band is not None}
        if band is not None:
            entry["start"] = band[0]
            entry["end"] = band[1]
        boundaries.append(entry)
    return boundaries


def _ranges_from_boundaries(
    length: int,
    count: int,
    boundaries: list[dict[str, Any]],
    guard_px: int,
) -> list[tuple[int, int]]:
    ranges: list[tuple[int, int]] = []
    start = 0
    for boundary in boundaries:
        if boundary.get("detected"):
            end = max(start + 1, min(length, int(boundary["start"]) - guard_px))
            next_start = max(end, min(length, int(boundary["end"]) + guard_px))
        else:
            end = int(boundary["expected"])
            next_start = int(boundary["expected"])
        ranges.append((start, end))
        start = next_start
    ranges.append((start, length))
    if len(ranges) != count:
        raise SplitGridError(f"Internal split planning error: expected {count} ranges, got {len(ranges)}")
    return ranges


def _plan_source_split(
    source: Path,
    *,
    width: int,
    height: int,
    cols: int,
    rows: int,
    black_threshold: int,
    min_black_coverage: float,
    search_ratio: float,
) -> tuple[list[tuple[int, int]], list[tuple[int, int]], dict[str, Any]]:
    gray = _read_gray_frame(source, width, height)
    row_coverages, column_coverages = _black_coverage_profiles(gray, width, height, black_threshold)
    horizontal = _divider_boundaries(
        length=height,
        count=rows,
        coverages=row_coverages,
        min_black_coverage=min_black_coverage,
        search_ratio=search_ratio,
    )
    vertical = _divider_boundaries(
        length=width,
        count=cols,
        coverages=column_coverages,
        min_black_coverage=min_black_coverage,
        search_ratio=search_ratio,
    )
    expected_count = max(0, rows - 1) + max(0, cols - 1)
    found_count = sum(1 for entry in horizontal + vertical if entry.get("detected"))
    horizontal_guard_px = max(0, int(round((height / rows) * DIVIDER_GUARD_RATIO))) if rows > 1 else 0
    vertical_guard_px = max(0, int(round((width / cols) * DIVIDER_GUARD_RATIO))) if cols > 1 else 0
    if expected_count == 0:
        split_mode = "single"
    elif found_count == expected_count:
        split_mode = "detected_dividers"
    elif found_count == 0:
        split_mode = "equal_grid"
    else:
        split_mode = "mixed_dividers"
    diagnostics = {
        "split_mode": split_mode,
        "detected_dividers": {
            "horizontal": horizontal,
            "vertical": vertical,
            "min_black_coverage": min_black_coverage,
            "search_ratio": search_ratio,
            "guard_ratio": DIVIDER_GUARD_RATIO,
            "horizontal_guard_px": horizontal_guard_px,
            "vertical_guard_px": vertical_guard_px,
        },
    }
    return (
        _ranges_from_boundaries(width, cols, vertical, vertical_guard_px),
        _ranges_from_boundaries(height, rows, horizontal, horizontal_guard_px),
        diagnostics,
    )


def _detect_black_crop(path: Path, black_threshold: int) -> tuple[int, int, int, int] | None:
    completed = subprocess.run(
        [
            "ffmpeg",
            "-hide_banner",
            "-nostdin",
            "-i",
            str(path),
            "-vf",
            f"cropdetect=limit={black_threshold}:round=2:reset=0",
            "-frames:v",
            "1",
            "-f",
            "null",
            "-",
        ],
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        details = (completed.stderr or completed.stdout or "").strip()
        raise SplitGridError(f"cropdetect failed for {path}\n{details}")
    matches = re.findall(r"crop=(\d+):(\d+):(\d+):(\d+)", completed.stderr + completed.stdout)
    if not matches:
        return None
    crop_w, crop_h, crop_x, crop_y = map(int, matches[-1])
    width, height = _probe_dimensions(path)
    if crop_w >= width - 2 and crop_h >= height - 2 and crop_x <= 1 and crop_y <= 1:
        return None
    if crop_w <= 0 or crop_h <= 0:
        return None
    return crop_w, crop_h, crop_x, crop_y


def _crop_is_abnormal(
    crop: tuple[int, int, int, int],
    width: int,
    height: int,
    max_crop_ratio: float,
) -> bool:
    crop_w, crop_h, crop_x, crop_y = crop
    left = crop_x / width
    right = (width - crop_w - crop_x) / width
    top = crop_y / height
    bottom = (height - crop_h - crop_y) / height
    return max(left, right, top, bottom) > max_crop_ratio


def _detect_edge_black_crop(
    path: Path,
    black_threshold: int,
    max_trim_ratio: float,
    min_black_coverage: float,
) -> tuple[int, int, int, int] | None:
    width, height = _probe_dimensions(path)
    gray = _read_gray_frame(path, width, height)
    row_coverages, column_coverages = _black_coverage_profiles(gray, width, height, black_threshold)
    max_x_trim = int(round(width * max_trim_ratio))
    max_y_trim = int(round(height * max_trim_ratio))

    top = 0
    while top < max_y_trim and row_coverages[top] >= min_black_coverage:
        top += 1

    bottom = 0
    while bottom < max_y_trim and row_coverages[height - 1 - bottom] >= min_black_coverage:
        bottom += 1

    left = 0
    while left < max_x_trim and column_coverages[left] >= min_black_coverage:
        left += 1

    right = 0
    while right < max_x_trim and column_coverages[width - 1 - right] >= min_black_coverage:
        right += 1

    if top == 0 and bottom == 0 and left == 0 and right == 0:
        return None
    crop_w = width - left - right
    crop_h = height - top - bottom
    if crop_w <= 0 or crop_h <= 0:
        return None
    return crop_w, crop_h, left, top


def _render_final(
    source: Path,
    destination: Path,
    target_width: int,
    target_height: int,
    crop: tuple[int, int, int, int] | None,
    output_format: str,
) -> None:
    filters: list[str] = []
    if crop is not None:
        crop_w, crop_h, crop_x, crop_y = crop
        filters.append(f"crop={crop_w}:{crop_h}:{crop_x}:{crop_y}")
    filters.extend([
        f"scale={target_width}:{target_height}:force_original_aspect_ratio=increase",
        f"crop={target_width}:{target_height}",
        "setsar=1",
    ])
    command = [
        "ffmpeg",
        "-hide_banner",
        "-nostdin",
        "-y",
        "-v",
        "error",
        "-i",
        str(source),
        "-vf",
        ",".join(filters),
        "-frames:v",
        "1",
    ]
    if output_format == "jpg":
        command.extend(["-q:v", "2"])
    command.append(str(destination))
    _run(command)


def split_keyframe_grid(
    *,
    grid_image_url: str,
    target_keyframe_count: int,
    aspect_ratio: str,
    resolution: str | None,
    segment_id: str,
    output_dir: str,
    black_threshold: int = 35,
    max_crop_ratio: float = 0.15,
    aspect_tolerance: float = 0.20,
    output_format: str = "jpg",
) -> dict[str, Any]:
    _require_tool("ffmpeg")
    _require_tool("ffprobe")

    if output_format not in ("jpg", "png"):
        raise SplitGridError("output_format must be 'jpg' or 'png'")
    if not 0 <= black_threshold <= 255:
        raise SplitGridError("black_threshold must be between 0 and 255")
    if not 0 < max_crop_ratio < 0.5:
        raise SplitGridError("max_crop_ratio must be greater than 0 and less than 0.5")
    if not 0 < aspect_tolerance < 0.5:
        raise SplitGridError("aspect_tolerance must be greater than 0 and less than 0.5")

    plan = plan_keyframe_grid(
        target_keyframe_count=target_keyframe_count,
        aspect_ratio=aspect_ratio,
        resolution=resolution,
    )
    target_width = int(plan["output_width"])
    target_height = int(plan["output_height"])
    cols = int(plan["layout"]["cols"])
    rows = int(plan["layout"]["rows"])
    kept_cells = int(plan["layout"]["kept_cells"])
    panel_ratio_width, panel_ratio_height = ASPECT_RATIOS[aspect_ratio]
    expected_generation_width, expected_generation_height = GENERATION_ASPECT_RATIOS[str(plan["generation_aspect_ratio"])]
    output_root = Path(output_dir).expanduser().resolve()
    output_root.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, Any] = {
        "segment_id": segment_id,
        "target_keyframe_count": target_keyframe_count,
        "aspect_ratio": aspect_ratio,
        "resolution": resolution or "2K",
        "target_panel_aspect_ratio": plan["target_panel_aspect_ratio"],
        "ideal_grid_aspect_ratio": plan["ideal_grid_aspect_ratio"],
        "ideal_grid_size": plan["ideal_grid_size"],
        "generation_aspect_ratio": plan["generation_aspect_ratio"],
        "generation_image_size": plan["generation_image_size"],
        "panel_layout_description": plan["panel_layout_description"],
        "output_width": target_width,
        "output_height": target_height,
        "layout": plan["layout"],
        "images": [],
        "warnings": [],
        "blockers": [],
    }

    with tempfile.TemporaryDirectory(prefix=f"{segment_id}_split_") as tmp:
        tmp_dir = Path(tmp)
        source = _download_or_resolve(grid_image_url, tmp_dir)
        source_width, source_height = _probe_dimensions(source)
        manifest["source_width"] = source_width
        manifest["source_height"] = source_height
        grid_deviation = _aspect_deviation(
            source_width,
            source_height,
            expected_generation_width,
            expected_generation_height,
        )
        manifest["source_generation_aspect_deviation"] = grid_deviation
        if grid_deviation > aspect_tolerance:
            manifest["blockers"].append({
                "reason": "generation_aspect_mismatch",
                "source_width": source_width,
                "source_height": source_height,
                "expected_generation_aspect_ratio": plan["generation_aspect_ratio"],
                "ideal_grid_aspect_ratio": plan["ideal_grid_aspect_ratio"],
                "aspect_deviation": grid_deviation,
                "aspect_tolerance": aspect_tolerance,
            })
            return manifest
        x_ranges, y_ranges, split_diagnostics = _plan_source_split(
            source,
            width=source_width,
            height=source_height,
            cols=cols,
            rows=rows,
            black_threshold=black_threshold,
            min_black_coverage=DIVIDER_MIN_BLACK_COVERAGE,
            search_ratio=DIVIDER_SEARCH_RATIO,
        )
        manifest.update(split_diagnostics)
        if split_diagnostics["split_mode"] in ("equal_grid", "mixed_dividers") and (cols > 1 or rows > 1):
            manifest["warnings"].append({
                "reason": "divider_detection_incomplete",
                "split_mode": split_diagnostics["split_mode"],
                "message": "Fell back to equal-grid boundaries for at least one divider.",
            })

        cell_paths: list[Path] = []
        for index in range(kept_cells):
            row = index // cols
            col = index % cols
            cell_path = tmp_dir / f"cell_{index + 1:02d}.png"
            x0, x1 = x_ranges[col]
            y0, y1 = y_ranges[row]
            crop_width = x1 - x0
            crop_height = y1 - y0
            if crop_width <= 0 or crop_height <= 0:
                manifest["blockers"].append({
                    "index": index,
                    "reason": "invalid_detected_cell_bounds",
                    "x": x0,
                    "y": y0,
                    "width": crop_width,
                    "height": crop_height,
                })
                continue
            _extract_region(source, x0, y0, crop_width, crop_height, cell_path)
            cell_paths.append(cell_path)
        if manifest["blockers"]:
            return manifest

        positions = FRAME_POSITIONS[target_keyframe_count]
        for index, cell_path in enumerate(cell_paths):
            cell_width, cell_height = _probe_dimensions(cell_path)
            black_crop = _detect_black_crop(cell_path, black_threshold)
            if black_crop is not None and _crop_is_abnormal(
                black_crop,
                cell_width,
                cell_height,
                max_crop_ratio,
            ):
                manifest["blockers"].append({
                    "index": index,
                    "reason": "abnormally_large_black_border",
                    "cell_width": cell_width,
                    "cell_height": cell_height,
                    "detected_crop": {
                        "width": black_crop[0],
                        "height": black_crop[1],
                        "x": black_crop[2],
                        "y": black_crop[3],
                    },
                    "max_crop_ratio": max_crop_ratio,
                })
                continue

            visible_width = black_crop[0] if black_crop is not None else cell_width
            visible_height = black_crop[1] if black_crop is not None else cell_height
            cell_deviation = _aspect_deviation(
                visible_width,
                visible_height,
                panel_ratio_width,
                panel_ratio_height,
            )
            if cell_deviation > aspect_tolerance:
                manifest["blockers"].append({
                    "index": index,
                    "reason": "cell_aspect_mismatch",
                    "cell_width": cell_width,
                    "cell_height": cell_height,
                    "visible_width": visible_width,
                    "visible_height": visible_height,
                    "expected_panel_aspect_ratio": aspect_ratio,
                    "aspect_deviation": cell_deviation,
                    "aspect_tolerance": aspect_tolerance,
                })
                continue

            extension = "jpg" if output_format == "jpg" else "png"
            output_path = output_root / f"{segment_id}_keyframe_{index + 1:02d}.{extension}"
            _render_final(
                cell_path,
                output_path,
                target_width,
                target_height,
                black_crop,
                output_format,
            )
            edge_black_crop = _detect_edge_black_crop(
                output_path,
                black_threshold,
                EDGE_TRIM_RATIO,
                EDGE_TRIM_MIN_BLACK_COVERAGE,
            )
            if edge_black_crop is not None:
                cleaned_path = tmp_dir / f"edge_clean_{index + 1:02d}.{extension}"
                _render_final(
                    output_path,
                    cleaned_path,
                    target_width,
                    target_height,
                    edge_black_crop,
                    output_format,
                )
                shutil.move(str(cleaned_path), str(output_path))
            image_entry: dict[str, Any] = {
                "index": index,
                "path": str(output_path),
                "width": target_width,
                "height": target_height,
            }
            if positions[index] is not None:
                image_entry["frame_position"] = positions[index]
            if black_crop is not None:
                image_entry["trimmed_black_border"] = {
                    "width": black_crop[0],
                    "height": black_crop[1],
                    "x": black_crop[2],
                    "y": black_crop[3],
                }
            if edge_black_crop is not None:
                image_entry["final_edge_trim"] = {
                    "width": edge_black_crop[0],
                    "height": edge_black_crop[1],
                    "x": edge_black_crop[2],
                    "y": edge_black_crop[3],
                    "max_trim_ratio": EDGE_TRIM_RATIO,
                    "min_black_coverage": EDGE_TRIM_MIN_BLACK_COVERAGE,
                }
            manifest["images"].append(image_entry)

    if manifest["blockers"]:
        manifest["images"] = []
    return manifest


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--grid-image-url")
    parser.add_argument("--target-keyframe-count", type=int, required=True)
    parser.add_argument("--aspect-ratio", required=True, choices=sorted(ASPECT_RATIOS))
    parser.add_argument("--resolution", default="2K")
    parser.add_argument("--segment-id")
    parser.add_argument("--output-dir")
    parser.add_argument("--black-threshold", type=int, default=35)
    parser.add_argument("--max-crop-ratio", type=float, default=0.15)
    parser.add_argument("--aspect-tolerance", type=float, default=0.20)
    parser.add_argument("--output-format", choices=["jpg", "png"], default="jpg")
    parser.add_argument("--plan-only", action="store_true")
    return parser.parse_args(argv)


def _manifest_exit_code(manifest: dict[str, Any]) -> int:
    return 2 if manifest.get("blockers") else 0


def main(argv: list[str]) -> int:
    args = _parse_args(argv)
    try:
        if args.plan_only:
            plan = plan_keyframe_grid(
                target_keyframe_count=args.target_keyframe_count,
                aspect_ratio=args.aspect_ratio,
                resolution=args.resolution,
            )
            print(json.dumps(plan, ensure_ascii=False, indent=2))
            return 0
        missing = [
            name
            for name, value in (
                ("--grid-image-url", args.grid_image_url),
                ("--segment-id", args.segment_id),
                ("--output-dir", args.output_dir),
            )
            if not value
        ]
        if missing:
            raise SplitGridError(f"{', '.join(missing)} required unless --plan-only is set")
        manifest = split_keyframe_grid(
            grid_image_url=str(args.grid_image_url),
            target_keyframe_count=args.target_keyframe_count,
            aspect_ratio=args.aspect_ratio,
            resolution=args.resolution,
            segment_id=str(args.segment_id),
            output_dir=str(args.output_dir),
            black_threshold=args.black_threshold,
            max_crop_ratio=args.max_crop_ratio,
            aspect_tolerance=args.aspect_tolerance,
            output_format=args.output_format,
        )
    except SplitGridError as exc:
        print(json.dumps({"blockers": [{"reason": str(exc)}]}, ensure_ascii=False, indent=2))
        return 2
    print(json.dumps(manifest, ensure_ascii=False, indent=2))
    return _manifest_exit_code(manifest)


def _has_global_invocation(namespace: dict[str, Any]) -> bool:
    return all(
        key in namespace
        for key in (
            "grid_image_url",
            "target_keyframe_count",
            "aspect_ratio",
            "segment_id",
            "output_dir",
        )
    )


def _run_from_globals(namespace: dict[str, Any]) -> int:
    manifest = split_keyframe_grid(
        grid_image_url=str(namespace["grid_image_url"]),
        target_keyframe_count=int(namespace["target_keyframe_count"]),
        aspect_ratio=str(namespace["aspect_ratio"]),
        resolution=namespace.get("resolution") or "2K",
        segment_id=str(namespace["segment_id"]),
        output_dir=str(namespace["output_dir"]),
        black_threshold=int(namespace.get("black_threshold", 35)),
        max_crop_ratio=float(namespace.get("max_crop_ratio", 0.15)),
        aspect_tolerance=float(namespace.get("aspect_tolerance", 0.20)),
        output_format=str(namespace.get("output_format", "jpg")),
    )
    namespace["result"] = manifest
    return _manifest_exit_code(manifest)


if __name__ == "__main__":
    if _has_global_invocation(globals()) and len(sys.argv) == 1:
        sys.exit(_run_from_globals(globals()))
    sys.exit(main(sys.argv[1:]))
elif _has_global_invocation(globals()):
    _run_from_globals(globals())

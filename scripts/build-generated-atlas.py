#!/usr/bin/env python3
"""Normaliza uma grade gerada em um atlas pixel-perfect previsível."""

from argparse import ArgumentParser
from pathlib import Path

from PIL import Image


def main() -> None:
    parser = ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--columns", type=int, required=True)
    parser.add_argument("--rows", type=int, required=True)
    parser.add_argument("--cell", type=int, required=True)
    parser.add_argument("--margin", type=int, default=2)
    parser.add_argument("--trim-alpha", action="store_true")
    parser.add_argument("--baseline", type=int)
    parser.add_argument("--padding", type=int, default=2)
    args = parser.parse_args()

    source = Image.open(args.source).convert("RGBA")
    atlas = Image.new(
        "RGBA",
        (args.columns * args.cell, args.rows * args.cell),
        (0, 0, 0, 0),
    )

    frames: list[Image.Image] = []
    for row in range(args.rows):
        for column in range(args.columns):
            left = round(column * source.width / args.columns) + args.margin
            top = round(row * source.height / args.rows) + args.margin
            right = round((column + 1) * source.width / args.columns) - args.margin
            bottom = round((row + 1) * source.height / args.rows) - args.margin
            frame = source.crop((left, top, right, bottom))
            if args.trim_alpha:
                bounds = frame.getchannel("A").getbbox()
                if bounds:
                    frame = frame.crop(bounds)
            frames.append(frame)

    uniform_scale = None
    if args.trim_alpha:
        max_width = max(frame.width for frame in frames)
        max_height = max(frame.height for frame in frames)
        baseline = args.baseline if args.baseline is not None else args.cell - args.padding
        uniform_scale = min(
            (args.cell - args.padding * 2) / max_width,
            (baseline - args.padding) / max_height,
        )

    for index, frame in enumerate(frames):
            row, column = divmod(index, args.columns)
            if uniform_scale is not None:
                frame = frame.resize(
                    (
                        max(1, round(frame.width * uniform_scale)),
                        max(1, round(frame.height * uniform_scale)),
                    ),
                    Image.Resampling.NEAREST,
                )
            else:
                frame.thumbnail((args.cell, args.cell), Image.Resampling.NEAREST)
            x = column * args.cell + (args.cell - frame.width) // 2
            if args.trim_alpha:
                baseline = args.baseline if args.baseline is not None else args.cell - args.padding
                y = row * args.cell + baseline - frame.height
            else:
                y = row * args.cell + (args.cell - frame.height) // 2
            atlas.alpha_composite(frame, (x, y))

    args.output.parent.mkdir(parents=True, exist_ok=True)
    atlas.save(args.output, optimize=True)
    print(f"Wrote {args.output} ({atlas.width}x{atlas.height})")


if __name__ == "__main__":
    main()

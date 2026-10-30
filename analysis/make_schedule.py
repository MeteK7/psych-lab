"""Generate a blocked-pair n-of-1 schedule (plan §4.2).

Each consecutive pair of eligible-day slots gets both conditions in random order.
The schedule is written once, before the phase starts; its SHA-256 goes into
docs/protocol-n-of-1.md. Existing schedules are never overwritten.

    uv run python make_schedule.py --phase 1
"""

import argparse
import csv
import hashlib
import json
import random
import secrets
import sys
from datetime import UTC, datetime
from pathlib import Path

PHASE_CONDITIONS: dict[int, tuple[str, str]] = {
    # Phase 0 is a test phase (walkthroughs); it uses phase-1 conditions and is never analysed.
    0: ("action_bridge", "goal_restatement"),
    1: ("action_bridge", "goal_restatement"),
    2: ("state_reset+action_bridge", "game_only+action_bridge"),
}
SCHEDULE_DIR = Path(__file__).resolve().parent / "schedules"


def build_schedule(phase: int, slots: int, seed: int) -> list[dict[str, str | int]]:
    """Rows of slot, pair and condition; every pair holds both conditions once."""
    if slots <= 0 or slots % 2:
        raise ValueError("slots must be a positive even number")
    a, b = PHASE_CONDITIONS[phase]
    rng = random.Random(seed)
    rows: list[dict[str, str | int]] = []
    for pair in range(1, slots // 2 + 1):
        order = [a, b] if rng.random() < 0.5 else [b, a]
        for offset, condition in enumerate(order):
            rows.append({"slot": 2 * pair - 1 + offset, "pair": pair, "condition": condition})
    return rows


def sha256_of(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_schedule(
    phase: int, slots: int, seed: int, out_dir: Path = SCHEDULE_DIR
) -> tuple[Path, str]:
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / f"schedule-phase{phase}.csv"
    if csv_path.exists():
        raise FileExistsError(f"{csv_path} already exists; schedules are written once.")

    rows = build_schedule(phase, slots, seed)
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["slot", "pair", "condition"], lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    digest = sha256_of(csv_path)
    (out_dir / f"schedule-phase{phase}.sha256").write_text(
        f"{digest}  {csv_path.name}\n", encoding="utf-8"
    )
    meta = {
        "phase": phase,
        "slots": slots,
        "seed": seed,
        "conditions": PHASE_CONDITIONS[phase],
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "csv_sha256": digest,
    }
    (out_dir / f"schedule-phase{phase}.meta.json").write_text(
        json.dumps(meta, indent=2) + "\n", encoding="utf-8"
    )
    return csv_path, digest


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--phase", type=int, choices=sorted(PHASE_CONDITIONS), required=True)
    parser.add_argument("--slots", type=int, default=28, help="eligible-day slots (even)")
    parser.add_argument("--seed", type=int, help="default: a fresh random seed, recorded")
    parser.add_argument("--out", type=Path, default=SCHEDULE_DIR)
    args = parser.parse_args(argv)

    seed = args.seed if args.seed is not None else secrets.randbits(63)
    try:
        path, digest = write_schedule(args.phase, args.slots, seed, args.out)
    except FileExistsError as exc:
        print(exc, file=sys.stderr)
        return 1
    print(f"Wrote {path}\nSHA-256 {digest}\nDon't read ahead: check only today's slot.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

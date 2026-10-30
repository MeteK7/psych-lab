import csv
import json
from collections import Counter
from pathlib import Path

import pytest

from make_schedule import PHASE_CONDITIONS, build_schedule, sha256_of, write_schedule


@pytest.mark.parametrize("phase", sorted(PHASE_CONDITIONS))
def test_every_pair_contains_both_conditions_once(phase: int) -> None:
    rows = build_schedule(phase, 28, seed=123)
    assert [r["slot"] for r in rows] == list(range(1, 29))
    for pair in range(1, 15):
        conditions = sorted(r["condition"] for r in rows if r["pair"] == pair)
        assert conditions == sorted(PHASE_CONDITIONS[phase])


def test_is_reproducible_from_the_seed_and_varies_between_seeds() -> None:
    assert build_schedule(1, 28, seed=7) == build_schedule(1, 28, seed=7)
    orders = {tuple(r["condition"] for r in build_schedule(1, 28, seed=s)) for s in range(20)}
    assert len(orders) > 1


def test_orders_are_not_fixed_within_pairs() -> None:
    rows = build_schedule(1, 200, seed=99)
    first_in_pair = Counter(r["condition"] for r in rows if r["slot"] % 2 == 1)
    # Both conditions lead some pairs (balance is random, not forced).
    assert set(first_in_pair) == set(PHASE_CONDITIONS[1])


def test_rejects_odd_slot_counts() -> None:
    with pytest.raises(ValueError):
        build_schedule(1, 27, seed=1)


def test_writes_csv_hash_and_metadata_once(tmp_path: Path) -> None:
    csv_path, digest = write_schedule(1, 4, seed=42, out_dir=tmp_path)

    with csv_path.open(encoding="utf-8", newline="") as f:
        rows = list(csv.DictReader(f))
    assert [r["slot"] for r in rows] == ["1", "2", "3", "4"]
    assert b"\r" not in csv_path.read_bytes()  # LF only, so the hash is stable

    assert digest == sha256_of(csv_path)
    assert (tmp_path / "schedule-phase1.sha256").read_text() == f"{digest}  schedule-phase1.csv\n"
    meta = json.loads((tmp_path / "schedule-phase1.meta.json").read_text())
    assert meta["seed"] == 42 and meta["csv_sha256"] == digest

    with pytest.raises(FileExistsError):
        write_schedule(1, 4, seed=43, out_dir=tmp_path)

#!/usr/bin/env python3
import argparse
import json
import os
import sys
import tempfile
import warnings

warnings.filterwarnings("ignore")

SESSION_MAP = {
    "practice-3": "Practice 3",
    "sprint-qualifying": "Sprint Qualifying",
    "sprint": "Sprint",
    "qualifying": "Qualifying",
    "race": "Race",
}


def extract_rows(results, pos_col="Position"):
    if results is None or results.empty or pos_col not in results.columns:
        return []
    rows = []
    for _, row in results.iterrows():
        raw_pos = row.get(pos_col)
        if raw_pos is None or str(raw_pos) == "nan":
            continue
        try:
            pos = int(float(raw_pos))
        except (ValueError, TypeError):
            continue
        if pos < 1:
            continue
        rows.append(
            {
                "position": pos,
                "number": str(row.get("DriverNumber", "") or "").strip(),
                "code": str(row.get("Abbreviation", "") or "").strip(),
                "firstName": str(row.get("FirstName", "") or "").strip(),
                "lastName": str(row.get("LastName", "") or "").strip(),
                "fullName": str(row.get("FullName", "") or "").strip(),
            }
        )
    rows.sort(key=lambda item: item["position"])
    return rows


def load_kind(fastf1, year: int, round_num: int, kind: str):
    if kind == "grid":
        try:
            race_session = fastf1.get_session(year, round_num, "Race")
            race_session.load(laps=False, telemetry=False, weather=False, messages=False)
            grid_rows = extract_rows(race_session.results, "GridPosition")
            if len(grid_rows) >= 10:
                return grid_rows
        except Exception:
            pass
        quali_session = fastf1.get_session(year, round_num, "Qualifying")
        quali_session.load(laps=False, telemetry=False, weather=False, messages=False)
        return extract_rows(quali_session.results, "Position")

    session_name = SESSION_MAP.get(kind)
    if not session_name:
        return []
    needs_laps = kind in ("practice-3", "sprint-qualifying")
    session = fastf1.get_session(year, round_num, session_name)
    session.load(laps=needs_laps, telemetry=False, weather=False, messages=needs_laps)
    return extract_rows(session.results, "Position")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", type=int, required=True)
    parser.add_argument("--round", type=int, required=True)
    parser.add_argument("--kind", type=str, required=True)
    args = parser.parse_args()

    try:
        import fastf1

        fastf1.logger.LoggingManager.set_level("ERROR")
        cache_dir = os.environ.get("FASTF1_CACHE") or os.path.join(tempfile.gettempdir(), "redline_fastf1_cache")
        os.makedirs(cache_dir, exist_ok=True)
        fastf1.Cache.enable_cache(cache_dir)
        rows = load_kind(fastf1, args.season, args.round, args.kind)
        print(json.dumps({"ok": len(rows) > 0, "drivers": rows}))
    except Exception as exc:
        print(json.dumps({"ok": False, "error": str(exc), "drivers": []}))


if __name__ == "__main__":
    main()


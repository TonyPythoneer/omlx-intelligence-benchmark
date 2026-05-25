import sys
import json
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from add_data import DataFile, parse_input

TMPL_PATH = Path(__file__).parent.parent / 'app' / 'data' / 'device.js.template'

SAMPLE_INPUT = """
--- Detail ---

Model: Qwen3.6-35B-A3B-TurboQuant-MLX-4bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 83.3%        25      30     835.1     Yes
TRUTHFULQA           90.0%        27      30     406.5     Yes
HUMANEVAL            93.3%        28      30    1117.7     Yes
MBPP                 90.0%        27      30    1275.5     Yes
LIVECODEBENCH        60.0%        18      30    5767.2     Yes

Model: Qwopus3.6-27B-v2-MLX-4bit
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 83.3%        25      30    2398.2     Yes
TRUTHFULQA           93.3%        28      30    1613.0     Yes
"""

NO_THINK_INPUT = """
--- Detail ---

Model: SomeModel-NoThink
Benchmark         Accuracy   Correct   Total   Time(s)   Think
--------------------------------------------------------------
MMLU                 70.0%        21      30     500.0     No
"""

SAMPLE_ENTRY = {
    "model": "TestModel",
    "date": "2026-05-25",
    "spec": {"parameters_b": 7, "quantization": "4bit", "size_gb": 4.10},
    "abilities": {"thinking": True, "mtp": False},
    "scores": {"MMLU": {"accuracy": 80.0, "samples": 30, "time_s": 100.0}},
}


@pytest.fixture
def make_data_file():
    tmpl_raw = TMPL_PATH.read_text().removeprefix('window.BENCHMARK_DATA = ').rstrip().rstrip(';')
    tmpl_data = json.loads(tmpl_raw)

    def _factory(entries=None) -> DataFile:
        df = DataFile.__new__(DataFile)
        df.path = None
        df._data = list(entries) if entries is not None else list(tmpl_data)
        return df

    return _factory


# ── parse_input ──────────────────────────────────────────────────────────────


def test_parse_returns_two_models():
    assert len(parse_input(SAMPLE_INPUT)) == 2


def test_parse_model_name():
    assert (
        parse_input(SAMPLE_INPUT)[0]["model"] == "Qwen3.6-35B-A3B-TurboQuant-MLX-4bit"
    )


def test_parse_scores_complete():
    scores = parse_input(SAMPLE_INPUT)[0]["scores"]
    assert set(scores.keys()) == {
        "MMLU",
        "TRUTHFULQA",
        "HUMANEVAL",
        "MBPP",
        "LIVECODEBENCH",
    }
    assert scores["MMLU"] == {"accuracy": 83.3, "samples": 30, "time_s": 835.1}


@pytest.mark.parametrize(
    "text,expected",
    [
        (SAMPLE_INPUT, True),
        (NO_THINK_INPUT, False),
    ],
    ids=["thinking", "no_thinking"],
)
def test_parse_thinking_flag(text, expected):
    assert parse_input(text)[0]["thinking"] is expected


def test_parse_partial_model():
    assert set(parse_input(SAMPLE_INPUT)[1]["scores"].keys()) == {"MMLU", "TRUTHFULQA"}


# ── DataFile ─────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "entries,name,expected",
    [
        ([{"model": "MyModel"}], "MyModel", True),
        ([], "MyModel", False),
    ],
    ids=["model_present", "model_absent"],
)
def test_model_exists(make_data_file, entries, name, expected):
    assert make_data_file(entries).model_exists(name) is expected


def test_append_adds_model(make_data_file):
    df = make_data_file()
    df.append(SAMPLE_ENTRY)
    assert any(e["model"] == "TestModel" for e in df._data)
    assert "MMLU" in df._data[0]["scores"]


def test_append_valid_js_structure(tmp_path, make_data_file):
    df = make_data_file()
    df.path = tmp_path / "test.js"
    df.append(SAMPLE_ENTRY)
    df.save()
    text = df.path.read_text()
    assert text.startswith("window.BENCHMARK_DATA")
    assert text.strip().endswith("]")


def test_append_two_models(make_data_file):
    df = make_data_file()
    df.append(SAMPLE_ENTRY)
    df.append({**SAMPLE_ENTRY, "model": "ModelB"})
    models = [e["model"] for e in df._data]
    assert "TestModel" in models
    assert "ModelB" in models


# ── read_default_device ──────────────────────────────────────────────────────


def test_read_default_device_from_settings(tmp_path, monkeypatch):
    (tmp_path / "app").mkdir()
    (tmp_path / "app" / "settings.js").write_text(
        'window.SETTINGS = { defaultDevice: "mbp-m1max-64GB-32c" }'
    )
    monkeypatch.chdir(tmp_path)
    assert DataFile.read_default_device() == "mbp-m1max-64GB-32c"


def test_read_default_device_missing(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert DataFile.read_default_device() is None


# ── deprecated field ─────────────────────────────────────────────────────────


def test_append_no_deprecated_field(make_data_file):
    """New entries appended via Python do not get a deprecated field."""
    df = make_data_file()
    df.append(SAMPLE_ENTRY)
    assert "deprecated" not in df._data[-1]


@pytest.mark.parametrize(
    "entries,expected_kept",
    [
        ([SAMPLE_ENTRY], 1),
        ([{**SAMPLE_ENTRY, "deprecated": True}], 0),
        ([{**SAMPLE_ENTRY, "deprecated": False}], 1),
    ],
    ids=["no_deprecated", "deprecated_true", "deprecated_false"],
)
def test_filter_deprecated(make_data_file, entries, expected_kept):
    """Verifies that entries with deprecated=True are correctly filtered."""
    df = make_data_file(entries)
    kept = [e for e in df._data if not e.get("deprecated")]
    assert len(kept) == expected_kept


def test_load_preserves_deprecated_field(tmp_path, make_data_file):
    """Deprecated field survives a save+reload cycle."""
    entry = {**SAMPLE_ENTRY, "deprecated": True}
    df = make_data_file([entry])
    df.path = tmp_path / "test.js"
    df.save()

    # Re-read and check deprecated is preserved
    raw = df.path.read_text().removeprefix('window.BENCHMARK_DATA = ').rstrip().rstrip(';')
    loaded = json.loads(raw)
    assert loaded[-1].get("deprecated") is True

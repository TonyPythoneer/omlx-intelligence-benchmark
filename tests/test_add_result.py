import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from add_data import parse_input, DataFile, read_default_device

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
    'model': 'TestModel',
    'date': '2026-05-25',
    'spec': {'parameters_b': 7, 'quantization': '4bit', 'size_gb': 4.10},
    'abilities': {'thinking': True, 'mtp': False},
    'scores': {'MMLU': {'accuracy': 80.0, 'samples': 30, 'time_s': 100.0}},
}


def make_data_file(tmp_path, content='window.BENCHMARK_DATA = []\n', key='test') -> DataFile:
    data_dir = tmp_path / 'app' / 'data'
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / f'{key}.js').write_text(content)
    df = DataFile.__new__(DataFile)
    df.path = data_dir / f'{key}.js'
    df.content = content
    return df


# ── parse_input ──────────────────────────────────────────────────────────────

def test_parse_returns_two_models():
    assert len(parse_input(SAMPLE_INPUT)) == 2

def test_parse_model_name():
    assert parse_input(SAMPLE_INPUT)[0]['model'] == 'Qwen3.6-35B-A3B-TurboQuant-MLX-4bit'

def test_parse_scores_complete():
    scores = parse_input(SAMPLE_INPUT)[0]['scores']
    assert set(scores.keys()) == {'MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'}
    assert scores['MMLU'] == {'accuracy': 83.3, 'samples': 30, 'time_s': 835.1}

def test_parse_thinking_flag():
    assert parse_input(SAMPLE_INPUT)[0]['thinking'] is True

def test_parse_thinking_false():
    assert parse_input(NO_THINK_INPUT)[0]['thinking'] is False

def test_parse_partial_model():
    assert set(parse_input(SAMPLE_INPUT)[1]['scores'].keys()) == {'MMLU', 'TRUTHFULQA'}


# ── DataFile ─────────────────────────────────────────────────────────────────

def test_model_exists_true(tmp_path):
    df = make_data_file(tmp_path, 'window.BENCHMARK_DATA = [{ model: "MyModel" }]\n')
    assert df.model_exists('MyModel') is True

def test_model_exists_false(tmp_path):
    df = make_data_file(tmp_path)
    assert df.model_exists('MyModel') is False

def test_append_adds_model(tmp_path):
    df = make_data_file(tmp_path)
    df.append(SAMPLE_ENTRY)
    assert 'model: "TestModel"' in df.content
    assert 'MMLU' in df.content
    assert df.content.strip().endswith(']')

def test_append_valid_js_structure(tmp_path):
    df = make_data_file(tmp_path)
    df.append(SAMPLE_ENTRY)
    assert df.content.startswith('window.BENCHMARK_DATA')
    assert ']' in df.content

def test_append_two_models(tmp_path):
    df = make_data_file(tmp_path)
    df.append(SAMPLE_ENTRY)
    df.append({**SAMPLE_ENTRY, 'model': 'ModelB'})
    assert 'model: "TestModel"' in df.content
    assert 'model: "ModelB"' in df.content
    assert df.content.strip().endswith(']')


# ── read_default_device ──────────────────────────────────────────────────────

def test_read_default_device_from_settings(tmp_path, monkeypatch):
    (tmp_path / 'app').mkdir()
    (tmp_path / 'app' / 'settings.js').write_text('window.SETTINGS = { defaultDevice: "mbp-m1max-64GB-32c" }')
    monkeypatch.chdir(tmp_path)
    assert read_default_device() == 'mbp-m1max-64GB-32c'

def test_read_default_device_missing(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    assert read_default_device() is None

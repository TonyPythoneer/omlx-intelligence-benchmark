import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from add_result import parse_input, model_exists, append_entry

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


def test_parse_returns_two_models():
    results = parse_input(SAMPLE_INPUT)
    assert len(results) == 2


def test_parse_model_name():
    results = parse_input(SAMPLE_INPUT)
    assert results[0]['model'] == 'Qwen3.6-35B-A3B-TurboQuant-MLX-4bit'


def test_parse_scores_complete():
    results = parse_input(SAMPLE_INPUT)
    scores = results[0]['scores']
    assert set(scores.keys()) == {'MMLU', 'TRUTHFULQA', 'HUMANEVAL', 'MBPP', 'LIVECODEBENCH'}
    assert scores['MMLU']['accuracy'] == 83.3
    assert scores['MMLU']['samples'] == 30
    assert scores['MMLU']['time_s'] == 835.1


def test_parse_thinking_flag():
    results = parse_input(SAMPLE_INPUT)
    assert results[0]['thinking'] is True


def test_parse_partial_model():
    results = parse_input(SAMPLE_INPUT)
    partial = results[1]
    assert set(partial['scores'].keys()) == {'MMLU', 'TRUTHFULQA'}


def test_model_exists_true():
    js = 'window.BENCHMARK_DATA = [{ model: "MyModel", scores: {} }]\n'
    assert model_exists(js, 'MyModel') is True


def test_model_exists_false():
    js = 'window.BENCHMARK_DATA = []\n'
    assert model_exists(js, 'MyModel') is False


def test_append_entry_adds_model():
    js = 'window.BENCHMARK_DATA = []\n'
    entry = {
        'model': 'TestModel',
        'date': '2026-05-25',
        'spec': {'parameters_b': 7, 'quantization': '4bit', 'size_gb': 4.10},
        'abilities': {'thinking': True, 'mtp': False},
        'scores': {'MMLU': {'accuracy': 80.0, 'samples': 30, 'time_s': 100.0}},
    }
    result = append_entry(js, entry)
    assert 'model: "TestModel"' in result
    assert 'MMLU' in result
    assert result.strip().endswith(']')


def test_append_entry_valid_js_structure():
    js = 'window.BENCHMARK_DATA = []\n'
    entry = {
        'model': 'A',
        'date': '2026-05-25',
        'spec': {'parameters_b': 7, 'quantization': '4bit', 'size_gb': 4.10},
        'abilities': {'thinking': False, 'mtp': False},
        'scores': {'MMLU': {'accuracy': 75.0, 'samples': 30, 'time_s': 50.0}},
    }
    result = append_entry(js, entry)
    assert result.startswith('window.BENCHMARK_DATA')
    assert ']' in result

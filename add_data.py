#!/usr/bin/env python3
"""Parse benchmark runner output and append to the correct data JS file."""

import sys
import re
import argparse
from pathlib import Path
from datetime import date

APP_DIR       = Path('app')
SETTINGS_FILE = APP_DIR / 'settings.js'
DATA_DIR      = APP_DIR / 'data'


def parse_input(text: str) -> list[dict]:
    """Return list of {model, thinking, scores} parsed from --- Detail --- text."""
    results = []
    blocks = re.split(r'(?=^Model:)', text, flags=re.MULTILINE)
    # Column layout: Benchmark  Accuracy%  Correct(skipped)  Total(=samples)  Time(s)  Think
    score_re = re.compile(
        r'^(\w+)\s+([\d.]+)%\s+\d+\s+(\d+)\s+([\d.]+)\s+(\w+)',
        re.MULTILINE,
    )
    for block in blocks:
        block = block.strip()
        if not block.startswith('Model:'):
            continue
        model_name = block.splitlines()[0].removeprefix('Model:').strip()
        scores = {}
        thinking = False
        for m in score_re.finditer(block):
            bench    = m.group(1)
            accuracy = float(m.group(2))
            samples  = int(m.group(3))  # group(3) = Total column; Correct is skipped
            time_s   = float(m.group(4))
            think    = m.group(5).lower() == 'yes'
            scores[bench] = {'accuracy': accuracy, 'samples': samples, 'time_s': time_s}
            if think:
                thinking = True
        if scores:
            results.append({'model': model_name, 'thinking': thinking, 'scores': scores})
    return results


class DataFile:
    """Manages reading, appending, and saving a device's benchmark JS data file."""

    def __init__(self, device_key: str):
        self.path = DATA_DIR / f'{device_key}.js'
        self.content = self.path.read_text() if self.path.exists() else 'window.BENCHMARK_DATA = []\n'

    def model_exists(self, model_name: str) -> bool:
        return f'model: "{model_name}"' in self.content

    def append(self, entry: dict) -> None:
        scores_lines = [
            f'      {bench}: {{ accuracy: {s["accuracy"]}, samples: {s["samples"]}, time_s: {s["time_s"]} }},'
            for bench, s in entry['scores'].items()
        ]
        scores_block = '\n'.join(scores_lines)
        new_obj = f"""  {{
    model: "{entry['model']}",
    date: "{entry['date']}",
    spec: {{
      parameters_b: {entry['spec']['parameters_b']},
      quantization: "{entry['spec']['quantization']}",
      size_gb: {entry['spec']['size_gb']:.2f},
    }},
    abilities: {{
      thinking: {'true' if entry['abilities']['thinking'] else 'false'},
      mtp: {'true' if entry['abilities']['mtp'] else 'false'},
    }},
    scores: {{
{scores_block}
    }}
  }},"""
        close_bracket = self.content.rfind(']')
        trimmed = self.content[:close_bracket].rstrip()
        separator = ',\n' if trimmed.endswith('}') else ''
        self.content = trimmed + separator + '\n' + new_obj + '\n]\n'

    def save(self) -> None:
        self.path.parent.mkdir(exist_ok=True)
        self.path.write_text(self.content)


def prompt_spec() -> dict:
    print('Enter model spec:')
    params_b = int(input('  parameters_b (e.g. 35): ').strip())
    quant    = input('  quantization (e.g. 4bit): ').strip()
    size_gb  = round(float(input('  size_gb (e.g. 19.50): ').strip()), 2)
    mtp_raw  = input('  mtp? (y/N): ').strip().lower()
    return {'parameters_b': params_b, 'quantization': quant, 'size_gb': size_gb, 'mtp': mtp_raw == 'y'}


def read_default_device() -> str | None:
    if not SETTINGS_FILE.exists():
        return None
    m = re.search(r'defaultDevice:\s*"([^"]+)"', SETTINGS_FILE.read_text())
    return m.group(1) if m else None


def main():
    default_device = read_default_device()
    parser = argparse.ArgumentParser(description='Append benchmark results to data JS file.')
    parser.add_argument('input', nargs='?', help='Path to benchmark output file (default: stdin)')
    parser.add_argument(
        '--device',
        default=default_device,
        required=default_device is None,
        help=f'Device key (default: {default_device or "required"})',
    )
    parser.add_argument('--params', type=int,   help='parameters_b')
    parser.add_argument('--quant',              help='quantization string, e.g. 4bit')
    parser.add_argument('--size',   type=float, help='size_gb')
    parser.add_argument('--mtp',    action='store_true', default=False)
    args = parser.parse_args()

    text = Path(args.input).read_text() if args.input else sys.stdin.read()
    parsed = parse_input(text)
    if not parsed:
        print('No model data found in input.', file=sys.stderr)
        sys.exit(1)

    if args.params is not None and args.quant and args.size is not None:
        spec = {'parameters_b': args.params, 'quantization': args.quant,
                'size_gb': round(args.size, 2), 'mtp': args.mtp}
    else:
        spec = prompt_spec()

    data = DataFile(args.device)
    added = 0
    for item in parsed:
        if data.model_exists(item['model']):
            print(f'SKIP (already exists): {item["model"]}')
            continue
        data.append({
            'model':     item['model'],
            'date':      str(date.today()),
            'spec':      {'parameters_b': spec['parameters_b'], 'quantization': spec['quantization'],
                          'size_gb': spec['size_gb']},
            'abilities': {'thinking': item['thinking'], 'mtp': spec['mtp']},
            'scores':    item['scores'],
        })
        print(f'Added: {item["model"]}')
        added += 1

    if added:
        data.save()
        print(f'Wrote {data.path}')


if __name__ == '__main__':
    main()

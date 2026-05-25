#!/usr/bin/env python3
"""Parse benchmark runner output and append to the correct device JSON data file."""

import sys
import re
import json
import argparse
from pathlib import Path
from datetime import date

def parse_input(text: str) -> list[dict]:
    """Return list of {model, thinking, scores} parsed from --- Detail --- text."""
    results = []
    blocks = re.split(r'(?=^Model:)', text, flags=re.MULTILINE)
    score_re = re.compile(
        r'^(?P<bench>\w+)\s+(?P<accuracy>[\d.]+)%\s+\d+\s+(?P<samples>\d+)\s+(?P<time_s>[\d.]+)\s+(?P<think>\w+)',
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
            g        = m.groupdict()
            bench    = g['bench']
            accuracy = float(g['accuracy'])
            samples  = int(g['samples'])
            time_s   = float(g['time_s'])
            think    = g['think'].lower() == 'yes'
            scores[bench] = {'accuracy': accuracy, 'samples': samples, 'time_s': time_s}
            if think:
                thinking = True
        if scores:
            results.append({'model': model_name, 'thinking': thinking, 'scores': scores})
    return results


class DataFile:
    """Manages reading, appending, and saving a device's benchmark JSON data file."""

    APP_DIR       = Path('app')
    SETTINGS_FILE = APP_DIR / 'settings.json'
    DATA_DIR      = APP_DIR / 'data'
    TMPL_FILE     = DATA_DIR / 'device.json.template'

    def __init__(self, device_key: str):
        self.path = self.DATA_DIR / f'{device_key}.json'
        src = self.path if self.path.exists() else self.TMPL_FILE
        with open(src) as f:
            self._data: list[dict] = json.load(f)

    def model_exists(self, model_name: str) -> bool:
        return any(e['model'] == model_name for e in self._data)

    def append(self, entry: dict) -> None:
        self._data.append(entry)

    def save(self) -> None:
        self.path.parent.mkdir(exist_ok=True)
        with open(self.path, 'w') as f:
            json.dump(self._data, f, indent=2)
            f.write('\n')

    @staticmethod
    def read_default_device() -> str | None:
        if not DataFile.SETTINGS_FILE.exists():
            return None
        with open(DataFile.SETTINGS_FILE) as f:
            return json.load(f).get('defaultDevice')


def prompt_spec() -> dict:
    with open('/dev/tty') as tty:
        def ask(prompt):
            print(prompt, end='', flush=True)
            return tty.readline().strip()
        print('Enter model spec:')
        params_b = int(ask('  parameters_b (e.g. 35): '))
        quant    = ask('  quantization (e.g. 4bit): ')
        size_gb  = round(float(ask('  size_gb (e.g. 19.50): ')), 2)
        mtp_raw  = ask('  mtp? (y/N): ').lower()
    return {'parameters_b': params_b, 'quantization': quant, 'size_gb': size_gb, 'mtp': mtp_raw == 'y'}


def main():
    default_device = DataFile.read_default_device()
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

    if args.input:
        text = Path(args.input).read_text()
    else:
        text = sys.stdin.read()
    parsed = parse_input(text)
    if not parsed:
        print('No model data found in input.', file=sys.stderr)
        sys.exit(1)

    data = DataFile(args.device)
    new_items = []
    for item in parsed:
        if data.model_exists(item['model']):
            print(f'SKIP (already exists): {item["model"]}', file=sys.stderr)
        else:
            new_items.append(item)
    if not new_items:
        sys.exit(0)
    parsed = new_items

    if args.params is not None and args.quant and args.size is not None:
        spec = {'parameters_b': args.params, 'quantization': args.quant,
                'size_gb': round(args.size, 2), 'mtp': args.mtp}
    else:
        spec = prompt_spec()

    added = 0
    for item in parsed:
        data.append({
            'model':      item['model'],
            'date':       str(date.today()),
            'spec':       {'parameters_b': spec['parameters_b'], 'quantization': spec['quantization'],
                           'size_gb': spec['size_gb']},
            'abilities':  {'thinking': item['thinking'], 'mtp': spec['mtp']},
            'deprecated': False,
            'tiers':      {'opus': False, 'sonnet': False, 'haiku': False},
            'scores':     item['scores'],
        })
        print(f'Added: {item["model"]}')
        added += 1

    if added:
        data.save()
        print(f'Wrote {data.path}')


if __name__ == '__main__':
    main()

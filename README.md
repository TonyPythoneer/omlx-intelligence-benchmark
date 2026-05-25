# oMLX Intelligence Benchmark

Personal benchmark comparison page for oMLX model results.

## Usage

Open `index.html` directly in the browser — no server needed.

## Add benchmark results

```bash
# From a file
python add_data.py /path/to/output.txt \
  --device mbp-m1max-64GB-32c \
  --params 35 --quant 4bit --size 19.50

# From stdin
cat output.txt | python add_data.py \
  --device mbp-m1max-64GB-32c \
  --params 35 --quant 4bit --size 19.50

# With MTP flag
python add_data.py output.txt \
  --device mbp-m1max-64GB-32c \
  --params 35 --quant 4bit --size 19.50 --mtp
```

## Run tests

```bash
make setup   # first time only
make test
```

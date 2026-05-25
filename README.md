# oMLX Intelligence Benchmark

Personal benchmark comparison page for oMLX model results.

## Local development

```bash
make serve            # serves app/ at http://localhost:8080
make serve PORT=3000  # custom port
```

Open `http://localhost:8080` in your browser.

## Deployment

Merging to `main` triggers GitHub Actions, which deploys the `app/` directory to GitHub Pages automatically.

Live URL: `https://TonyPythoneer.github.io/omlx-intelligence-benchmark/`

## Add benchmark results

```bash
# From a file
python add_data.py /path/to/output.txt \
  --device m1-max-64GB-32c \
  --params 35 --quant 4bit --size 19.50

# From stdin
cat output.txt | python add_data.py \
  --device m1-max-64GB-32c \
  --params 35 --quant 4bit --size 19.50

# With MTP flag
python add_data.py output.txt \
  --device m1-max-64GB-32c \
  --params 35 --quant 4bit --size 19.50 --mtp
```

Output is written to `app/data/{device}.json`.

## Run tests

```bash
make setup   # first time only
make test
```

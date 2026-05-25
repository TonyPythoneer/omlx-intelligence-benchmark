PORT ?= 8080

.PHONY: setup test serve

setup:
	python3 -m venv .venv
	.venv/bin/pip install pytest

test:
	.venv/bin/pytest tests/ -v

serve:
	python3 -m http.server $(PORT) --directory app

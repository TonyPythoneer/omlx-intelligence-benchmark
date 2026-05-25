.PHONY: test setup

setup:
	python3 -m venv .venv
	.venv/bin/pip install pytest

test:
	.venv/bin/pytest tests/ -v

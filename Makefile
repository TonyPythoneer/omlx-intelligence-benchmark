PORT ?= 8080

.PHONY: setup test serve add

setup:
	python3 -m venv .venv
	.venv/bin/pip install pytest

test:
	.venv/bin/pytest tests/ -v

serve:
	python3 -m http.server $(PORT) --directory app

# macOS only — copies clipboard content and pipes to add_data.py
add:
	pbpaste | python3 add_data.py

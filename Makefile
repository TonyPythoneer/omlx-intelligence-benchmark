PORT ?= 8080

.PHONY: serve

serve:
	python3 -m http.server $(PORT) --directory app

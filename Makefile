PORT ?= 8080

.PHONY: serve test

serve:
	vp dev --port $(PORT)

test:
	vp test

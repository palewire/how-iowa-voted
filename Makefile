.PHONY: data data/iowa-counties.json

results:
	python data/process.py

maps:
	node_modules/.bin/topojson \
		-p \
		--id="GEOID" \
		--width=960 \
		--height=600 \
		--projection="d3.geo.mercator()" \
		-o data/iowa-counties.json \
		-- counties=data/iowa-counties.shp

	node_modules/.bin/topojson-merge \
		-o static/json/iowa.json \
		--in-object=counties \
		--out-object=state \
		--key='d.properties.STATEFP' \
		-- data/iowa-counties.json;

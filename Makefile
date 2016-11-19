.PHONY: data data/iowa-counties.json

results:
	python data/process.py

maps:
	node_modules/.bin/topojson \
		-p \
		--id="GEOID" \
		--projection='d3.geo.mercator()' \
		--width=960 \
		--height=600 \
		-o data/iowa-counties.json \
		-- counties=data/iowa-counties.shp

	node_modules/.bin/topojson-merge \
		-o static/iowa.json \
		--in-object=counties \
		--out-object=state \
		--key='d.properties.STATEFP' \
		-- data/iowa-counties.json;

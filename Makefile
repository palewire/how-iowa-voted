.PHONY: data data/iowa-counties.json

data:
	python data/process.py

json:
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

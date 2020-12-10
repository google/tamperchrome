ENV=--prod
FAKE=.FORCE dev prod local

prod: background ui
	jq 'del(.key)' manifest_base.json > manifest.json

dev: ENV=
dev: prod
	cp manifest_base.json manifest.json

crx.zip: prod
	rm -f crx.zip
	zip -r crx.zip background/*.html background/sw.js background/out ui/dist icons manifest.json

crx_local: crx.zip
	rm -f crx_local
	cp crx.zip crx_local
	cd crx_local && unzip crx.zip
	cp manifest_base.json > crx/manifest.json

background: .FORCE node_modules/@types/chrome
	cd background && tsc --project src/tsconfig.json

node_modules/@types/chrome:
	npm install --save @types/chrome

ui/node_modules:
	cd ui && npm install

ui: .FORCE ui/node_modules
	cd ui && ng build ${ENV}

.FORCE:

clean:
	rm -rf ui/node_modules node_modules background/out ui/dist manifest.json crx.zip

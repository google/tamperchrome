ENV=--prod
FAKE=.FORCE dev prod local

crx.zip: prod
	rm -f crx.zip
	zip -r crx.zip background/*.html background/sw.js background/out ui/dist icons manifest.json

crx_local: crx.zip
	rm -rf crx_local
	mkdir crx_local
	cp crx.zip crx_local
	cd crx_local && unzip crx.zip
	cp manifest_base.json crx_local/manifest.json

prod: background ui
	jq 'del(.key)' manifest_base.json > manifest.json

dev: ENV=
dev: prod
	cp manifest_base.json manifest.json

background: .FORCE node_modules/@types/chrome
	cd background && tsc --project src/tsconfig.json

node_modules/@types/chrome:
	npm install --save @types/chrome

ui/node_modules:
	git submodule init
	cd ui && npm install --save protractor-accessibility-plugin
	cd ui && npm install

ui: .FORCE ui/node_modules
	cd ui && ng lint && ng build ${ENV}

e2e: .FORCE ui/node_modules
	cd ui && ng e2e

.FORCE:

clean:
	rm -rf ui/node_modules node_modules background/out ui/dist manifest.json crx.zip

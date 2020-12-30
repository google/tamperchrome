ENV=--prod
FAKE=.FORCE dev prod local test e2e e2e-goldens lint

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
dev: lint prod
	cp manifest_base.json manifest.json

background: .FORCE node_modules/@types/chrome
	cd background && tsc --project src/tsconfig.json

node_modules/@types/chrome:
	npm install --save @types/chrome

ui/node_modules:
	git submodule init && git submodule update
	cd ui && npm install

lint: ui/node_modules
	cd ui && ng lint

ui: .FORCE ui/node_modules
	cd ui && ng build ${ENV}

test: ui/node_modules
	cd ui && ng test --browsers=ChromeHeadless --watch=false --code-coverage

e2e: ui/node_modules
	cd ui && ng e2e

e2e-goldens:
	ui/e2e/src/goldens/update.sh

.FORCE:

clean:
	rm -rf ui/node_modules node_modules background/out ui/dist manifest.json crx.zip

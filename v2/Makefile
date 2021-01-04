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

crx_test: crx_local
	rm -rf crx_test
	cp -r crx_local crx_test
	jq '.permissions += ["tabs", "<all_urls>"]' crx_local/manifest.json > crx_test/manifest.json

prod: background ui
	jq 'del(.key)' manifest_base.json > manifest.json

dev: ENV=
dev: lint prod
	cp manifest_base.json manifest.json

background/node_modules:
	cd background && npm install

background: .FORCE background/node_modules
	cd background && tsc --project src/tsconfig.json

ui/node_modules:
	git submodule init && git submodule update
	cd ui && npm install

lint: ui/node_modules
	cd ui && ng lint

ui: .FORCE ui/node_modules
	cd ui && ng build ${ENV}

ui/test: .FORCE ui/node_modules
	cd ui && ng test --browsers=ChromeHeadless --watch=false --code-coverage

background/test: .FORCE background/node_modules crx_test
	cd background && npm test

test: ui/test

e2e: .FORCE ui/node_modules
	cd ui && ng e2e

e2e-goldens:
	ui/e2e/src/goldens/update.sh

.FORCE:

clean:
	rm -rf ui/dist ui/node_modules background/out background/node_modules manifest.json crx.zip crx_local

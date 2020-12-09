ENV=--prod
FAKE=dev

all: background ui

dev: ENV=
dev: all

crx.zip: all
	rm -f crx.zip
	zip -r crx.zip *

background: FORCE node_modules/@types/chrome
	cd background && tsc --project src/tsconfig.json

node_modules/@types/chrome:
	npm install --save @types/chrome

ui/node_modules:
	cd ui && npm install

ui: FORCE ui/node_modules
	cd ui && ng build ${ENV}

FORCE:

clean:
	rm -rf ui/node_modules node_modules background/out ui/dist

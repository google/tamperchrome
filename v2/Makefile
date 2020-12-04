all: background ui

background: FORCE node_modules/@types/chrome
	cd background && tsc --project src/tsconfig.json

node_modules/@types/chrome:
	npm install --save @types/chrome

ui/node_modules:
	cd ui && npm install

ui: FORCE ui/node_modules
	cd ui && ng build --prod

FORCE:

clean:
	rm -rf ui/node_modules node_modules background/out ui/dist

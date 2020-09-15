background: FORCE node_modules/@types/chrome
	cd background && tsc --project src/tsconfig.json

node_modules/@types/chrome:
	npm install --save @types/chrome

FORCE:

clean:
	rm -rf package-lock.json node_modules background/out


#!/bin/bash

git pull origin master
npm install
echo Compiling TypeScript...
cd src
tsc
echo TypeScript compiled
cd ..

echo NPM build
cd front/src
npm run build
echo builded
cd ../..
pm2 restart main

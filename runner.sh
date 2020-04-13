echo "starting job@",$(date)
token="f5230155b2e7da3fe89e63ff26a072254d1db923"

git pull https://github.com/VICS-CORE/covid-api.git && cd covid-api

node csv_to_json.js

git add .
git commit -m "daily update of med resources at $(date)"

git push origin master

echo "Done pushing -- please check"

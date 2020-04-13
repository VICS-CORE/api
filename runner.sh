echo "starting job@",$(date)
token=""

git pull git@github.com:VICS-CORE/covid-api.git && cd covid-api

node csv_to_json.js

git add .
git commit -m "daily update of med resources at $(date)"

git push origin master

echo "Done pushing -- please check"
cd ..
rm -rf covid-api

echo "cleaned covid-api from workspace"

#### for cronjob #####

echo "starting job@",$(date)
token=""

cd covid-api && git pull git@github.com:VICS-CORE/covid-api.git

/home/epuser/node-v12.16.2/bin/node csv_to_json.js

git add .
git commit -m "daily update of med resources at $(date)"

git push origin master

echo "Done pushing -- please check"
cd ..

#rm -rf covid-api
#echo "cleaned covid-api from workspace"

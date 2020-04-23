#### for cronjob #####

echo "starting job@",$(date)

cd covid-api && git pull git@github.com:VICS-CORE/covid-api.git

pushd medresources
python3 gen_timeline.py
popd

git add .
git commit -m "daily update of medresources timeline at $(date)"

git push origin master

echo "Done pushing -- please check"
cd ..

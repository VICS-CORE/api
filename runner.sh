#!/bin/bash
echo "Generating statewise predictions", $(date)

pushd covid-net
python -m scripts.gen_statewise_predictions 0001 latest-e1740.pt -d 200 -vpf ../covid-api/vp/1.1740.json
popd

pushd covid-api
git add vp
git commit -m "Daily update to 1.1740"
git push origin master
popd

echo "Pushed"
cd ..

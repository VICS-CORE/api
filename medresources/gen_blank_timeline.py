import json
import requests

r = requests.get("https://api.covid19india.org/state_district_wise.json")
ci_data = r.json()

ret = {}
ret['name'] = 'India'
ret['timeline'] = {}
ret['states'] = []

for state_name in ci_data:
    ret_state = {
        'name': state_name,
        'districts': [],
        'timeline': {}
    }
    for dist_name in ci_data[state_name]['districtData']:
        ret_state['districts'].append({
            'name': dist_name,
            'timeline': {}
        })
    ret['states'].append(ret_state)

with open("blank_timeline.json", "w") as f:
    f.write(json.dumps(ret, indent=2))

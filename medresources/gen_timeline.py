from sheets import read_sheet
from covid_warriors_data import fetch_data
import datetime
import json

END_DATE = datetime.datetime.now().strftime("%Y-%m-%d")
QUALITY = "unreliable"
LEGEND = ["beds", "icu_beds", "ventilators", "doctors", "nurses"]

# iterate over dates inclusively
def daterange(start_date, end_date):
    for n in range(int((end_date - start_date).days) + 1):
        yield start_date + datetime.timedelta(n)

# fill current date data in a timeline object, given previous date
def fill_tlo(tlo, data, cd, pd, covid_warriors_data=[]):
    # init current date's district timeline with previous date's data else 0s
    tlo[cd] = tlo[pd][:] if pd in tlo else tlo.get(cd, [0]*15)

    # sort based on total & additional
    data_total = list(filter(lambda x: x['type'] == 'total', data))
    data_additional = list(filter(lambda x: x['type'] == 'additional', data))

    for row in data_additional:
        idx = LEGEND.index(row['metric'])
        val = int(row['quantity'])
        tlo[cd][idx] += val
    for row in data_total:
        idx = LEGEND.index(row['metric'])
        val = int(row['quantity'])
        tlo[cd][idx] = max(val, tlo[cd][idx])
        if len(covid_warriors_data) >= 3:
            tlo[cd][3] = covid_warriors_data[3]
            tlo[cd][4] = covid_warriors_data[4]
 
# generate an aggregate timeline by adding up districts or states on a particular date
def agg_tlo(parent_obj, key, cd):
    # compute agg at cd (current date)
    agg = [0]*15
    child_resources_at_cd = [child['timeline'][cd] for child in parent_obj[key]]
    for resources in child_resources_at_cd:
        agg = list(map(
            lambda x,y:x+y,
            agg,
            resources
        ))

    # if agg level obj doesn't exist, fill with previous day's values or else 0s
    # note that if the obj already exists, e.g. for state level data, we don't reinitialise
    if cd not in parent_obj['timeline']:
        parent_obj['timeline'][cd] = parent_obj['timeline'][pd][:] if pd in parent_obj['timeline'] else [0]*15
    # keep max of current day's values or agg
    for i in range(len(parent_obj['timeline'][cd])):
        parent_obj['timeline'][cd][i] = max(parent_obj['timeline'][cd][i], agg[i])

# fetch data
url = "https://docs.google.com/spreadsheets/export?format=csv&id=14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA&gid=1696158556"
data = read_sheet(url, True)
covid_warriors_data = fetch_data()

if QUALITY == "reliable":
    data = filter(lambda x: x['quality'] == QUALITY, data)

# read timeline template
with open("blank_timeline.json") as f:
    tl = json.loads(f.read())

sorted_data = sorted(data, key = lambda x: x['date'])
min_date = sorted_data[0]['date']
min_date_obj = datetime.datetime.strptime(min_date, "%Y-%m-%d")

max_date = sorted_data[-1]['date']
end_date_obj = datetime.datetime.strptime(END_DATE, "%Y-%m-%d")
max_date_obj = max(end_date_obj, datetime.datetime.strptime(max_date, "%Y-%m-%d"))

# DATE LOOP
for cd_obj in daterange(min_date_obj, max_date_obj):
    # set previous date, current date
    pd = (cd_obj - datetime.timedelta(days=1)).strftime("%Y-%m-%d")
    cd = cd_obj.strftime("%Y-%m-%d")
    print("DATE:", cd, pd)
    
    # current date's data
    cd_data = list(filter(lambda x: x['date'] == cd, sorted_data))
    if len(cd_data): print("Found", len(cd_data), "records.")

    # STATE LOOP
    covid_warriors_states = covid_warriors_data['states']

    for state in tl['states']:
        print("STATE:", state['name'])
        
        # DIST LOOP
        covid_warriors_state = next(filter(lambda i: i['name'].lower().__eq__(state['name'].lower()), covid_warriors_states), False)

        for dist in state['districts']:
            print("DISTRICT:", dist['name'])
            
            # find current date data for district
            dist_data = list(filter (lambda x: dist['name'] == x['district'], cd_data))
            if len(dist_data): print("Found", len(dist_data), "records.")
            # fill dist level timeline object from data
            fill_tlo(dist['timeline'], dist_data, cd, pd)
            
        # find current date data for state i.e. Unknown district data
        state_data = list(filter (lambda x: (state['name'] == x['state']) and (x['district'] == 'Unknown'), cd_data))
        if len(state_data): print("Found", len(state_data), "state records.")
        # fill state level timeline object from data

        if covid_warriors_state and state_data:
            covid_warriors_state_data = covid_warriors_state['timeline']['2020-05-23']

        fill_tlo(state['timeline'], state_data, cd, pd, covid_warriors_state_data)
        # agg dist data
        agg_tlo(state, 'districts', cd)

    agg_tlo(tl, 'states', cd)

tl['legend'] = ['cb', 'ci', 'cv', 'cd', 'cn', 'ub', 'ui', 'uv', 'ud', 'un', 'pb', 'pi', 'pv', 'pd', 'pn']
tl['last_updated_time'] = datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")

with open("timeline.json", "w") as f:
    f.write(json.dumps(tl, indent=2))

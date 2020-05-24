import json
import requests

def fetch_data():
	r = requests.get("https://vics-core.github.io/covid-api/medresources/covid_warrioros_resource.json")
	data = r.json()

	return data
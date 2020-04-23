import requests
import json


def read_sheet(url, header_keys=False):
    r = requests.get(url)
    csv_lines = r.text.split("\r\n")

    sheet_data = []
    begin = 0

    if header_keys:
        keys = csv_lines[0].split(",")
        begin = 1

    for csv_line in csv_lines[begin:]:
        values = csv_line.split(",")
        if header_keys:
            sheet_data.append({keys[i]: values[i] for i in range(len(keys))})
        else:
            sheet_data.append(values)
    
    return sheet_data

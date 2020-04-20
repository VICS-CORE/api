var https = require('https')
var url = 'https://docs.google.com/spreadsheets/export?format=csv&id=14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA&gid=1696158556'
var path = require('path')
var fs = require('fs')
var today = new Date();
var hrs = today.getHours();
var min = today.getMinutes();
var sec = today.getSeconds();
var date = today.getDate();
var month = ("0" + today.getMonth()).slice(-2);
var year = today.getFullYear();
var last_update = date+'/'+month+'/'+year+' '+hrs+':'+min+':'+sec;
var fs = require('fs');
var legend =  ["cb","ci","cv","cd","cn","ub","ui","uv","ud","un","pb","pi","pv","pd","pn"]
re = {}
for(var i = 0;i<legend.length;i++){
    re[legend[i]] = i;
}
console.log(re);
    /*
    
    - sort on state + district + date + metric
- for each state + district
    for each date + metric
      if district != unknown
        fill previous date's quantity or 0 if nothing available
        isAdditional ? add to previous date's quantity : keep max (this qty, previous date's qty)
      else
        include in state.timeline with same logic
    aggregate districts.timeline to state.timeline
aggregate states.timeline to toplevel.timeline
    
    
    
    */
https.get(url,function(resp){
    var body = '';
    resp.on('data',function(data){
        body+=ab2str(data);
    })
    .on('end',function() {
        var rows  = body.split(/\r\n/i);
        //console.log(rows);
        var final_data = []
        for(var i =1;i<rows.length;i++){
            final_data.push(rows[i].split(','));
        }
        final_data = final_data.sort(Comparator);
        var min_date = final_data[0][0];
        var max_date = final_data[final_data.length-1][0];

        var timeline_dates = getDates(new Date(min_date),new Date(max_date));
        for(var i = 0;i<timeline_dates.length;i++){
            var temp = timeline_dates[i];
            var year = temp.getFullYear();
            var month = ("0" + (temp.getMonth()+1)).slice(-2);
            var date = ("0" + temp.getDate()).slice(-2);
            timeline_dates[i] = year+'-'+month+'-'+date;
            console.log(timeline_dates[i]);
        }
        var temp = groupby(final_data,timeline_dates);
        temp['name'] = 'India';
        temp['legend'] = legend;
        temp['last_updated_time']= last_update;
        temp['timeline'] = {};
        console.log(JSON.stringify(temp));
        fs.writeFileSync(path.resolve(__dirname,'./medresources/timeline.json'),JSON.stringify(temp));
        console.log('Generated timeline.json');
    })
});
Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function getDates(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate <= stopDate) {
        dateArray.push(new Date (currentDate));
        currentDate = currentDate.addDays(1);
    }
    return dateArray;
}

function ab2str(buf){
    return String.fromCharCode.apply(null,new Uint16Array(buf));
}

/*
    
    - sort on state + district + date + metric
- for each state + district
    for each date + metric
      if district != unknown
        fill previous date's quantity or 0 if nothing available
        isAdditional ? add to previous date's quantity : keep max (this qty, previous date's qty)
      else
        include in state.timeline with same logic
    aggregate districts.timeline to state.timeline
aggregate states.timeline to toplevel.timeline
    
    
    
    */
function Comparator(a,b) {
    if(a[0] > b[0]) return 1;
    else if(a[0]<b[0]) return -1;
    return 0;
}
var type_dict = {'beds':['cb','ub','pb'],'icu_beds':['ci','ui','pi'],'ventilators':['cv','uv','pv'],'doctors':['cd','ud','pd'],'nurses':['cn','un','pn']};

function groupby(data,dates) {
    ans = {'states':[]}
    states={}
    var  j = 0;
    for(var i = 0;i<dates.length;i++){
        console.log(dates[i],"i loop")
        while(j < data.length && data[j][0]=== dates[i]){
            console.log(data[j],dates[i]);
            var timeline = data[j][0].trimLeft().trimRight();
            var state = data[j][1].trimLeft().trimRight();
            var district = data[j][2].trimLeft().trimRight();
            var type = data[j][3].trimLeft().trimRight();  ///beds,nurses, etc
            var tot_add = data[j][4].trimLeft().trimRight(); //total or additional
            var quantity = Number(data[j][5].trimLeft().trimRight()); 
            var assurance = data[j][6].trimLeft().trimRight();
            if(states[state]===undefined){
                //state not found. insert one
                states[state] = {};
                states[state][district] = [];
                states[state][district].push(timeline);
        var temp = {}
        temp['name'] = state;
        temp['timeline'] = {};
        temp['districts'] = [];
        var dist = {}
        dist['name'] = district
        dist['timeline'] = {}
        dist['timeline'][dates[i]] = generate_array(type,quantity,0);
        temp['districts'].push(dist);
        //temp['timeline'][timeline] = dist['timeline'][timeline];
        ans['states'].push(temp);
            }else {
                //state found. look for district
                var func_state = function(element){
                    return element['name'] === state;
                }
                var index = ans['states'].findIndex(func_state);
                if(index!== -1){
                    if(states[state][district]===undefined) {
                        //district not found previously, adding a new district
                        states[state][district]= []
                        states[state][district].push(timeline);
                        var temp = {};
                        temp['name']  = district;
                        temp['timeline'] = {}
                        temp['timeline'][dates[i]] = generate_array(type,quantity,0); 
                        ans['states'][index]['districts'].push(temp);

                    }else {
                        //district found. search for index. if timeline is new, 
                        var dist_func = function(element){
                            return element['name'] === district;
                        }
                        var dist_index = ans['states'][index]['districts'].findIndex(dist_func);
                        if(dist_index != -1){
                            if(ans['states'][index]['districts'][dist_index]['timelines'][timeline]=== undefined){
                                if(i>0){
                                    if(tot_add==='total'){
                                        ans['states'][index]['districts'][dist_index]['timelines'][timeline] = get_max(generate_array(type,quantity,0),ans['states'][index]['districts'][dist_index]['timelines'][dates[i-1]]);
                                    }else {
                                        ans['states'][index]['districts'][dist_index]['timelines'][timeline] = add_arrays(generate_array(type,quantity,0),ans['states'][index]['districts'][dist_index]['timelines'][dates[i-1]]);

                                    }
                            }else {
                                ans['states'][index]['districts'][dist_index]['timelines'][timeline] = generate_array(type,quantity,0);
                            }
                            }else {
                                if(tot_add==='total'){
                                    ans['states'][index]['districts'][dist_index]['timelines'][timeline] = get_max(generate_array(type,quantity,0),ans['states'][index]['districts'][dist_index]['timelines'][dates[i]]);
                                }else {
                                    ans['states'][index]['districts'][dist_index]['timelines'][timeline] = add_arrays(generate_array(type,quantity,0),ans['states'][index]['districts'][dist_index]['timelines'][dates[i]]);
                                }

                            }
                        }

                    }
                }
           
                
            }
            j+=1;
        }
    }

    return ans;  
    }
    

function get_max(a,b) {
    var arr = []
    for(var i = 0;i<a.length;i++){
        arr.push(Math.max(a[i],b[i]));
    }
    return arr;
}
function add_arrays(a,b){
    var arr = []
    for(var i = 0;i<a.length;i++){
        arr.push(a[i] + b[i]);
    }
    return arr;
}
function sub_arrays(a,b){
    var arr = []
    for(var i = 0;i<a.length;i++){
        arr.push(a[i] - b[i]);
    }
    return arr;
}
function generate_array(type,amount,opt){
    arr = []  /** type- beds, nurses etc.., amount- quantity, opt- capacity/utilization/prediction */
    for(var i = 0;i<15;i++){
        arr.push(0)
    }
    var cd = type_dict[type][opt];
    cd = re[cd];
    arr[cd] = amount;
    return arr;
}

function compare_timestamp(t1,t2){
    var t11 = t1[0].split(" ")
    var t21 = t2[0].split(" ")
    var t1_date = t11[0].split("/").map(Number);
    var t2_date = t21[0].split("/").map(Number);
    var t1_time = t11[1].split(":").map(Number);
    var t2_time = t21[1].split(":").map(Number);
    console.log(t1_date,t2_date);
    if(t1_date[2]>=t2_date[2]){
        console.log("t1.year high");
        if(t1_date[0]>= t2_date[0]){
            console.log("t1.month high");
            if(t1_date[1]>=t2_date[1]){
                console.log("t1 date high");
                if(t1_time[0]>=t2_time[0]){
                    console.log("t1 hours high");
                    if(t1_time[1]>=t2_time[1]){
                        console.log("t1 minutes high");
                        if(t1_time[2]>= t2_time[2]){
                            console.log("t1 seconds");
                            return 1;
                        }
                    }
                }
            }
        }
    }
    return 0;    
}

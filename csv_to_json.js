let url = 'https://docs.google.com/spreadsheets/d/14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA/export?format=csv&id=14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA&gid=1378136055'
let sheet_id = '14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA'
let page_id = '1378136055'
var https = require('https')
var path = require('path')
const fs = require('fs')
const fetch = require('node-fetch')
let settings = {method:'Get'};
var today = new Date();
var hrs = today.getHours();
var min = today.getMinutes();
var sec = today.getSeconds();
var date = today.getDate();
var month = ("0" + today.getMonth()).slice(-2);
var year = today.getFullYear();
var last_update = date+'/'+month+'/'+year+' '+hrs+':'+min+':'+sec;
/*fetch(url,settings).then((res) => res
).then((json)=> {
    console.log(json.feed.updated.$t);
});*/
https.get(url,function(resp) {
    var body = '';
    resp.on('data',function(data){
        body+=ab2str(data);
    })
    .on('end',function(){
        var json = [];
        var rows = body.split(/\r\n/i);
        //console.log(rows);
        temp = {}
        final_data = []
        for(var j = 1;j<rows.length;j++){
            final_data.push(rows[j].split(','));
            }
        
        temp['last_updated_time'] = last_update;
        temp['name'] = "India"
        final_data = filler(final_data);
        final_data = make_sets(final_data);
        temp['states'] = groupby(final_data);
        console.log(final_data);
        head_row = rows[0];
        console.log(head_row);
        
        fs.writeFileSync(path.resolve(__dirname,'./medresources/'+date+month+year+'.json'),JSON.stringify(temp));
        console.log('Generated '+date+month+year+'.json');

    });
});

function filler(data){
    /*4 to 8*/
    for(var i = 0;i<data.length;i++){
        for(var j = 4;j<=8;j++){
            if(data[i][j] === ''){
                data[i][j] = '0'
            }
        }
    }
    return data;
}
function ab2str(buf){
    return String.fromCharCode.apply(null,new Uint16Array(buf));
}

function make_sets(data){
    /*state,district,blah blah*/
    var ans = {}
    for(var i = data.length-1;i>=0;i--){
        //console.log("entered index:",i);
        if(ans[data[i][1]]!== undefined){ //searching for state in the ans dict
            //console.log("found state:",data[i][1]);
            var temp = ans[data[i][1]];
            //console.log("found state:",data[i][1],ans);
            if(temp[data[i][2]] !== undefined){ //searching for district in the temp subdict
                //console.log("found district:",data[i][2],temp[data[i][2]]);
               /* var func = function(element){
                    console.log(element === data[i][3],element,data[i][3]);
                    return(element === data[i][3]);   //a function to check if this hospital has previously appeared in the spreadsheet
                }
                var index = temp[data[i][2]].indexOf(func);*/
                var hosp = temp[data[i][2]][data[i][3]];
                //console.log("searching for hospital:",data[i][3]);
                if(hosp !== undefined){
                    //console.log("replacing null values for",data[i][3]," with new values if any");
                for(var j = 4;j<=8;j++){
                    if(data[hosp][j] === '0' && data[i][j]!=='0'){
                        data[hosp][j] = data[i][j];
                        
                    }
                    data[i][j] = '0';
                }
            }else {
                //console.log("marked hospital:",data[i][3]);
                ans[data[i][1]][data[i][2]][data[i][3]] = i;
            }
                
            }
            else {
                //console.log("creating new district:",data[i][2]);
                ans[data[i][1]][data[i][2]] = {}
                ans[data[i][1]][data[i][2]][data[i][3]] = i;

                //console.log("creating new district:",data[i][2],ans);
            }
        }else {
            
            ans[data[i][1]] = {}
            ans[data[i][1]][data[i][2]] = {}
                ans[data[i][1]][data[i][2]][data[i][3]] = i;
            //console.log("creating new state:",data[i][1],ans);
        }
    }

    console.log(ans);
    return data;
}

function groupby(data){
    console.log(data.length);
    var states = {}
    var ans = []
    for(var i = 0;i<data.length;i++){
    if(states[data[i][1]]!==undefined){
        var state_func = function(element){
            return element['name'] === data[i][1];
        }
        var state_index = ans.findIndex(state_func);
        var func = function(element){
            return element === data[i][2];
        }
        var index = states[data[i][1]].findIndex(func);
        //console.log('i:' + i +',' + index+':'+data[i][2]);
        if(index!= -1){
            var temp = ans[state_index]['districts'][index]['total'];
            temp['beds'] = Number(temp['beds']) + Number(data[i][4]);
            temp['doctors'] = Number(temp['doctors'])  + Number(data[i][7]);
            temp['icu_beds'] = Number(temp['icu_beds']) + Number(data[i][5]);
            temp['nurses'] = Number(temp['nurses']) + Number(data[i][8]);
            temp['ventilators'] = Number(temp['ventilators']) + Number(data[i][6]);
            ans[state_index]['districts'][index]['total'] = temp;
        }else {
            var te = {'name':data[i][2],'total':{}};
            var temp = te['total'];
            temp['beds'] =  Number(data[i][4]);
            temp['doctors'] = Number(data[i][7]);
            temp['icu_beds'] =  Number(data[i][5]);
            temp['nurses'] =  Number(data[i][8]);
            temp['ventilators'] = Number(data[i][6]);
            te['total'] = temp;

            ans[state_index]['districts'].push(te);
            //console.log(ans[state_index]['districts']);
        }
        ans[state_index]['total']['beds'] = ans[state_index]['total']['beds'] + Number(data[i][4]);
        ans[state_index]['total']['doctors'] = ans[state_index]['total']['doctors'] +  Number(data[i][7]);
        ans[state_index]['total']['icu_beds'] = ans[state_index]['total']['icu_beds'] + Number(data[i][5]);
        ans[state_index]['total']['nurses'] = ans[state_index]['total']['nurses'] +  Number(data[i][8]);
        ans[state_index]['total']['ventilators'] =  ans[state_index]['total']['ventilators'] + Number(data[i][6]);    

        
    }else {
        states[data[i][1]] = [];
        states[data[i][1]].push(data[i][2]);
        var te = {'name':'','total':{'beds':Number(data[i][4]),'doctors':Number(data[i][7]),'icu_beds':Number(data[i][5]),'nurses':Number(data[i][8]),'ventilators':Number(data[i][6])},'districts':[]}
        te['name'] = data[i][1];
        te['districts'].push({'name':data[i][2],'total':{'beds':Number(data[i][4]),'doctors':Number(data[i][7]),'icu_beds':Number(data[i][5]),'nurses':Number(data[i][8]),'ventilators':Number(data[i][6])}});
        ans.push(te);

    }
    
    
    }
    return ans;
}

//console.log(compare_timestamp("4/4/2020 0:47:15","4/3/2020 0:47:15"));
function compare_timestamp(t1,t2){
    var t11 = t1.split(" ")
    var t21 = t2.split(" ")
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
                            return true;
                        }
                    }
                }
            }
        }
    }
    return false    
}

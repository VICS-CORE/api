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
var month = today.getMonth();
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
        temp['states'] = groupby(final_data);
        //console.log(temp);
        head_row = rows[0];
        //console.log(head_row);
        /* structure of states 
        name: <name of the state>
         total: {beds,doctors,icu_beds,nurses,ventilators}
         districts: [{name:<name of district>,total: {beds,doctors,icu_beds,nurses,ventilators}},{}]
        
        

       for(var i =1;i<rows.length;i++){
            var t = {}

       }
        
        for (var i = 0;i<rows.length;i++){
            json.push(rows[i].split(/\t/i));
        }*/
        fs.writeFileSync(path.resolve(__dirname,'./sheet_final.json'),JSON.stringify(temp));
        console.log('Generated sheet.json');

    });
});
/*
var data = fs.readFileSync('./final_data.csv',{encding:'utf8',flag:'r'})
data = ab2str(data);
var rows = data.split(/\r\n/i);
console.log(rows);
final_data = []
for(var j = 1;j<rows.length;j++){
    final_data.push(rows[j].split(','));
}
console.log(final_data);
req_data = {}
req_data['last_updated_time'] = last_update;
req_data['name'] = 'India'
req_data['states'] = groupby(final_data)
console.log(JSON.stringify(req_data));
fs.writeFileSync('./sheets.json',JSON.stringify(req_data));
head_row = rows[0].split(',');
//console.log(head_row);
*/
function ab2str(buf){
    return String.fromCharCode.apply(null,new Uint16Array(buf));
}
function groupby(data){
    console.log(data.length);
    var states = []
    var ans = []
    for(var i = 0;i<data.length;i++){
       if(states.includes(data[i][0])){
           var func = function(element) {
                return element['name'] === data[i][0];
           }
            var index = ans.findIndex(func);
            console.log('i:' + i +',' + index+':'+data[i][0]);
            if(index!= -1){
                ans[index]['districts'].push({'name':data[i][1],'total':{'beds':data[i][2],'doctors':data[i][5],'icu_beds':data[i][3],'nurses':data[i][6],'ventilators':data[i][4]}});
                ans[index]['total'] = {'beds': ans[index]['total']['beds'] + Number(data[i][2]),'doctors': ans[index]['total']['doctors']+ Number(data[i][5]),'icu_beds': ans[index]['total']['icu_beds']+Number(data[i][3]),'nurses': ans[index]['total']['nurses'] + Number(data[i][6]),'ventilators': ans[index]['total']['ventilators'] + Number(data[i][4])};
            }
       }
       else{
           states.push(data[i][0]);
            var te = {'name':'','total':{'beds':Number(data[i][2]),'doctors':Number(data[i][5]),'icu_beds':Number(data[i][3]),'nurses':Number(data[i][6]),'ventilators':Number(data[i][4])},'districts':[]}
            te['name'] = data[i][0];
            te['districts'].push({'name':data[i][1],'total':{'beds':Number(data[i][2]),'doctors':Number(data[i][5]),'icu_beds':Number(data[i][3]),'nurses':Number(data[i][6]),'ventilators':Number(data[i][4])}});
            ans.push(te);
       }
    }
    console.log(states);
    return ans;
}


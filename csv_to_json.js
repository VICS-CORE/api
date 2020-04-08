let url = 'https://docs.google.com/spreadsheets/d/14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA/export?format=csv&id=14WsYKGWUVRZL2YXHLPcjiNyfTWTjaRlLGcPEAKndsmA&gid=1378136055';
var https = require('https');
var path = require('path');
const fs = require('fs');
var today = new Date();
var hrs = today.getHours();
var min = today.getMinutes();
var sec = today.getSeconds();
var date = today.getDate();
var month = today.getMonth();
var year = today.getFullYear();
var last_update = date+'/'+month+'/'+year+' '+hrs+':'+min+':'+sec;

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

        fs.writeFileSync(path.resolve(__dirname,'./resources.json'),JSON.stringify(temp));
        console.log('Generated resources.json');

    });
});

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

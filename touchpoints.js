/* Created 06-21-12 : mae
*
*
*
*/

// Define variables 
var year = new Date().getFullYear().toString();
var yesterday = new Date().getDate()-1;
var month = new Date().getMonth()+1;

function addLeadingZero(input) {
  var outputString = "";
  if (input.toString().length < 2)
  {
    outputString = "0" + input.toString();
  }
  else
  {
    outputString = input.toString();
  }
  
  return outputString;
}

function setStartDate(year, month, day) {
  var outDate = year + "-" + addLeadingZero(month) + "-" + addLeadingZero(day) + "T00:00:00-0800";
  return outDate;
}

function setEndDate(year, month, day){
  var outDate = year + "-" + addLeadingZero(month) + "-" + addLeadingZero(day) + "T23:59:59-0800";
  return outDate;
}

var searchStart = setStartDate(year, month, yesterday);
var searchEnd = setEndDate(year, month, yesterday);

var resultsJSON = db.user_touchpoints.group(
  {
    key: { "touchpoints.0.touchpoint" :  true},
    cond: { "touchpoints.0.created_at" : { $gte: ISODate(searchStart), $lt: ISODate(searchEnd) }},
    initial: { count: 0 },
    reduce: function(doc, prev) { prev.count +=1 }
  });
  
print("Android Touchpoints: " + resultsJSON[0].count);
print("Desktop Touchpoints: " + resultsJSON[2].count);
print("Web Touchpoints: " + resultsJSON[1].count);
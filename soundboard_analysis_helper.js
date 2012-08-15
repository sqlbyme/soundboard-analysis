/*
 *
 * Created 08-14-12 - MAE
 *
 * This is a js helper file used when trying to test the soundboard_analysis.js file.
 * This file is loaded into the mongo cli environment to assist in manually running map/reduce jobs and whatnot
 * This is not meant to be run as a stand-alone script.
 *
 *
 *
 */

/*
 * Change Log
 * 08-14-12 - me - initial file creation and script setup.
 *
 */


// This function helps us determine if we are pre/post noon time
function IsAM(d) {
   return (d.getHours() < 12 ? true : false);
}

// This is the addCommas function
 function addCommas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
 };
 
 // The following functions help us determine the number of collections per user.
 function usertilesMap () {

   emit ( this.user_id, { count: 1 });

 }

 function usertilesReduce (key, values) {

   var total = 0;
   for ( var i=0; i<values.length; i++ )
     total += values[i].count;
   return { count : total };

 }

 // Define the user_count and collection_count vars
 var user_count = 0,
     collection_count = 0;

// This is an older function which works much like a map/reduce to determine the number of connection each user has.
 function printColl(coll) {
   user_count += 1;
   collection_count += coll.value["count"];
 }


// Here we setup the dates used in the touchpoints query 
 var year = new Date().getFullYear().toString();
 var yesterday = IsAM(new Date()) ? new Date().getDate()-1 : new Date().getDate();
 var month = new Date().getMonth()+1;
 
 // We needed a function to add a leading zero to the month or day in order to build a conforming ISODate type
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
 
// Set the Starting and Ending search dates
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

// Setup the map/reduce job to determine the toucpoint counts for new users to Songbird.me
function touchpointMap () {
  emit ( this.touchpoints[0].touchpoint, { count: 1 });
  
}

function touchpointReduce (key, values) {
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count : total };
}



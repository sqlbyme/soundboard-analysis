/*
 * Created by PD
 * Updated by ME
 *
 * This js file is used in conjunction with a call to the mongo database
 * soundboard-staging.  This will run the following queries and produce
 * an output which is then emailed to users associated with the
 * dailyreports@songbirdnest.com distribution list.
 *
 * The job that calls this file is run from the jenkins instance on the carson.songbirdnest.com server.
 * The job is labeled soundboard-daily-report-process.
 *
 * if you have questions/comments about this file or the job that runs it please contatc
 * mike@songbirdnest.com.
 *
 * if mike does not work here anymore and this job is still running and being used on a daily 
 * basis...trust me, you've got much bigger problems than dealing with this file.  Good luck!
 *
 */

/*
 * Change Log
 * 3-21-12 - me - added the Change Log and documented the top of the doc.
 * 3-21-13 - me - added the function addCommas to the file.
 * 3-21-12 - me - added the output of the Number of Tiles Dismissed.
 * 5-31-12 - me - updated schema to remove "buckets" as they have been deprecated.
 * 8-09-12 - me - had to change the user_touchpoint.group function to a map/reduce block due to a limit of 20,000 unique keys on the group function.
 * 8-10-12 - me - had to change the collection_per_user.group function to a map/reduce block for same reason above.
 */

//Display Report Header

// First we need to determine if it is before or after noon
function IsAM(d) {
   return (d.getHours() < 12 ? true : false);
}

print("******************************");
IsAM(new Date()) ? print("Soundboard Morning Stats" ) : print("Soundboard Afternoon Stats");
print(new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString());
print("******************************");

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


/* Commented Out as this is being deprecated.  This block should be removed in the near future.
collections_per_user = db.user_tiles.group(
    { key: { user_id: true },
      reduce: function(obj,out) {
                out.count += 1;
              },
      initial: { count: 0 }
    });
*/

function usertilesMap () {
  
  emit ( this.user_id, { count: 1 });
  
}

function usertilesReduce (key, values) {
  
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count : total };
  
}

var collections_per_user = db.user_tiles.mapReduce (usertilesMap, usertilesReduce, {out: { inline : 1 } } );

total_tiles_collected = db.user_tiles.find().count();


var user_count = 0,
    collection_count = 0;

function printColl(coll) {
  user_count += 1;
  collection_count += coll.value["count"];
}

var shares_per_user = db.user_actions.group(
    { key: { user_id: true },
      cond: { action: 0 },
      reduce: function(obj,out) {
                out.count += 1;
              },
      initial: { count: 0 }
    });

collections_per_user.results.forEach(printColl);

var year = new Date().getFullYear().toString();
var yesterday = IsAM(new Date()) ? new Date().getDate()-1 : new Date().getDate();
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

/* Commented Out as this is being deprecated.  This block should be removed in the near future.
var resultsJSON = db.user_touchpoints.group(
  {
    key: { "touchpoints.0.touchpoint" :  true},
    cond: { "touchpoints.0.created_at" : { $gte: ISODate(searchStart), $lt: ISODate(searchEnd) }},
    initial: { count: 0 },
    reduce: function(doc, prev) { prev.count +=1 }
  });
*/ 
  
function touchpointMap () {
  emit ( this.touchpoints[0].touchpoint, { count: 1 });
  
}

function touchpointReduce (key, values) {
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count : total };
}

new_users_today = db.users.find( { created_at: { $gte: ISODate(searchStart), $lte: ISODate(searchEnd) } } ).count();
total_users = db.users.find( { created_at: { $lte: ISODate(searchEnd) } } ).count();
var resultsJSON = db.user_touchpoints.mapReduce (touchpointMap, touchpointReduce, {out: { inline : 1}, query: { "touchpoints.0.created_at" : { $gte: ISODate(searchStart), $lt: ISODate(searchEnd) } } } );
total_touchpoints = resultsJSON.results[0].value.count + resultsJSON.results[1].value.count + resultsJSON.results[2].value.count;
print("Total Registered Users: " + addCommas(total_users));
print("New Users: " + addCommas(new_users_today));
print("Total Artist to Fan Connections: " + addCommas(total_tiles_collected));
print("Number of Users Connecting to an Artist: " + addCommas(user_count));
print("Avg Number of Artist Connections / User: " + addCommas((collection_count/user_count).toFixed(2)));
print("******************************");
print("Touchpoints Count - if report is run before 12:00 counts are previous day.")
print("Android Touchpoints: " + resultsJSON.results[0].value.count);
print("Desktop Touchpoints: " + resultsJSON.results[1].value.count);
print("Web Touchpoints: " + resultsJSON.results[2].value.count);
print("Total Touchpoints: " + addCommas(total_touchpoints));
print("******************************");




// Start Soundboard Top 100 listing
print();
print("******************************");

var artistCount = addCommas(total_tiles_collected);

print("Soundboard Top 100 Connections!");
print();

var top100 = db.artists.find({}, { _id: 0}).sort({ tfc: -1 }).limit(100);
var top100i = 1;
top100.forEach( function(cell) {
  print(top100i + ": " + cell.artist_name + " - " + addCommas(cell.tfc) + " fan connections.");
  top100i ++;
});
// End Soundboard Top 100 Listing

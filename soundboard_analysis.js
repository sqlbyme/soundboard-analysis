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
 * 9-26-12 - me - added ugc map/reduce total and per artist counts.
 * 10-4-12 - me - changed the method for calculating total follows and fixed a bug with ugc m/r query.
 * 12-1-12 - me - changing the IsAM check on the date set method to always just get yesterdays stats.
 * 12-14-12 - me - added polling data for Alternative Login Methods.
 */

//Display Report Header

// First we need to determine if it is before or after noon
function IsAM(d) {
   return (d.getHours() < 12 ? true : false);
}
// end IsAm

print("Mime-Version: 1.0");
print("Content-Type: text/html");
print("To: dailyreports@songbirdnest.com");
print("Subject: Daily Soundboard Stats");

// Output the report header
print("<br/>******************************<br/>");
IsAM(new Date()) ? print("Soundboard Morning Stats<br/>" ) : print("Soundboard Afternoon Stats<br/>");
print(new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString() + "<br/>");
print("******************************<br/>");

// This is the addCommas function - we use this function to make numbers larger than 1000 prettier to display.
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


// Begin user follow count section
// This section of code is where we determine how many artists a user is following.
// These vars also help us determine a bit of engandement becuase we can see how many users are active vs
// how many just sing up and never follow an artist (which is hard to do since we auto-follow now).
var total_tiles_collected = db.user_tiles.find().count();

var user_count = db.user_tiles.distinct("user_id").length;
// end section


// These vars set the current year and month and then set the date based upon 
// whether or not it is before noon. Could probably remove the IsAM check
// based on the fact that we no longer run the report twice a day.
var year = new Date().getFullYear().toString();
var yesterday = new Date().getDate()-1;
var month = new Date().getMonth()+1;


// This function adds a leading zero to an int value
// we use this to add a leading zero to the month or date vars because the ISODate()
// function expects the month and date args to be two digit
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


// This function sets a string value which will be used as an arg of an ISODate call later
function setStartDate(year, month, day) {
  var outDate = year + "-" + addLeadingZero(month) + "-" + addLeadingZero(day) + "T00:00:00-0800";
  return outDate;
}

// Same as above
function setEndDate(year, month, day){
  var outDate = year + "-" + addLeadingZero(month) + "-" + addLeadingZero(day) + "T23:59:59-0800";
  return outDate;
}

// Set the start and end dates to search between
var searchStart = setStartDate(year, month, yesterday);
var searchEnd = setEndDate(year, month, yesterday);


// Setup the map / reduce for the Touchpoints
function touchpointMap () {
  emit ( this.touchpoints[0].touchpoint, { count: 1 });
  
}

function touchpointReduce (key, values) {
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count : total };
}


// Setup the map / reduce for Likes
function likesMap () {
	emit ( this.artist_id, { count: this.like_count });
}

function likesReduce (key, values) {
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count: total };
  
}

// Setup the map / reduce for Comments
function commentsMap () {
	emit ( this.artist_id, { count: this.comment_count });
}

function commentsReduce (key, values) {
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count: total };
  
}

/* Commented out 2-5-13 as UGC is no longer an interesting metric to us.
// Setup the map / reduce for UGC
function ugcMap () {
  emit (this.user_id, { count: this.invalid ? 0 : 1 });
}


function ugcReduce (key, values) {
  var total = 0;
  for ( var i=0; i<values.length; i++ )
    total += values[i].count;
  return { count: total };  
}
// End function def
*/

// Function to get the Artist name given a particular artist id.
function getName(aid) {
  var retName = db.artists.findOne( { _id: ObjectId(aid) } );
  return retName.artist_name;
}

// Set the vars to prep them for output.
// Artist Count
var artistCount = db.artists.find( { disabled: { $ne: true } } ).count();
var diasbledArtistCount = db.artists.find( { disabled: true } ).count();

// User count
var total_users = db.users.find( { created_at: { $lte: ISODate(searchEnd) } } ).count();

// Touchpoints
var resultsJSON = db.user_touchpoints.mapReduce (touchpointMap, touchpointReduce, {out: { inline : 1}, query: { "touchpoints.0.created_at" : { $gte: ISODate(searchStart), $lt: ISODate(searchEnd) } } } );
var androidTouch = resultsJSON.results[0] ? resultsJSON.results[0].value.count : 0;
var desktopTouch = resultsJSON.results[1] ? resultsJSON.results[1].value.count : 0;
var iOSTouch = resultsJSON.results[2] ? resultsJSON.results[2].value.count: 0;
var webTouch = resultsJSON.results[3] ? resultsJSON.results[3].value.count : 0;
var total_touchpoints = androidTouch + desktopTouch + iOSTouch + webTouch;

// Likes
var likesJSON = db.artist_updates.mapReduce( likesMap, likesReduce, { out: { inline: 1 }, query: { like_count: { $gte: 1 } } } );
var likesCounter = 0;
  likesJSON.results.forEach( function(cell) { likesCounter += cell.value.count; });

// Comments
var commentsJSON = db.artist_updates.mapReduce( commentsMap, commentsReduce, { out: { inline: 1 }, query: { comment_count: { $gte: 1 } } } );
var commentsCounter = 0;
    commentsJSON.results.forEach( function(cell) { commentsCounter += cell.value.count; });

/*
// UGC
var ugcJSON = db.artist_updates.mapReduce( ugcMap, ugcReduce, { out: { inline: 1 }, query: { user_id: { $ne: true } } } );
var ugcCounter = 0;
  ugcJSON.results.forEach( function(cell) { ugcCounter += cell.value.count; });
//var ugcAvgItemsPerArtist = ugcCounter / artistCount;
*/

// Engadgement
var newUsers = db.users.find( { created_at: { $gte: ISODate(searchStart), $lte: ISODate(searchEnd) }, afa: { $ne: true } } ).count();
var activeUsers = db.users.find( { afa: { $gte: ISODate(searchStart), $lte: ISODate(searchEnd) } } ).count();
var returningUsers = activeUsers - newUsers;

// Alternate Login Polling
var polls = db.polls.findOne();
var pollTotal = polls.votes.email + polls.votes.twitter + polls.votes.google


// Output results to the display or an email
print("Total Registered Users: " + addCommas(total_users) + "<br/>");
print("New Users: " + addCommas(newUsers) + "<br/>");
print("Active Users: " + addCommas(activeUsers) + "<br/>");
print("Returning Users: " + addCommas(returningUsers) + "<br/>");
print("Total Artist to Fan Connections: " + addCommas(total_tiles_collected) + "<br/>");
print("Number of Users Connecting to an Artist: " + addCommas(user_count) + "<br/>");
print("Avg Number of Artist Connections / User: " + addCommas((total_tiles_collected/user_count).toFixed(2)) + "<br/>");
print("Total Likes: " + addCommas(likesCounter) + "<br/>");
print("Total Comments: " + addCommas(commentsCounter) + "<br/>");
print("******************************<br/>");
print("Touchpoints Count - if report is run before 12:00 counts are previous day.<br/>");
print("Android Touchpoints: " + addCommas(androidTouch) + "<br/>");
print("Desktop Touchpoints: " + addCommas(desktopTouch) + "<br/>");
print("iOS Touchpoints: " + addCommas(iOSTouch) + "<br/>");
print("Web Touchpoints: " + addCommas(webTouch) + "<br/>");
print("Total Touchpoints: " + addCommas(total_touchpoints) + "<br/>");
/*
print("******************************<br/>");
print("UGC Count<br/>");
print("Total UGC Items: " + addCommas(ugcCounter) + "<br/>");
*/
print("******************************<br/>");
print("Alternate Login Polls<br/>");
print("Total Votes Cast: " + addCommas(pollTotal) + "<br/>");
print("Email: " + addCommas(polls.votes.email) + "<br/>");
print("Google: " + addCommas(polls.votes.google) + "<br/>");
print("Twitter: " + addCommas(polls.votes.twitter) + "<br/>");
print("******************************<br/>");

// Start Soundboard Top 100 listing

// Output the section header
print("Soundboard Top 100 Connections of " + addCommas(artistCount) + " Artists!<br/>");
print("<br/>");

// Function to get the number of likes per artist
function getLikes(aid) {
  var retLikes = db.artist_updates.mapReduce( likesMap, likesReduce, { out: { inline: 1 }, query: { artist_id: aid } } );
  return retLikes.results[0] ? retLikes.results[0].value.count: 0;
}
// End

// Function to get the number of comments per artist
function getComments(aid) {
  var retComments = db.artist_updates.mapReduce( commentsMap, commentsReduce, { out: { inline: 1 }, query: { artist_id: aid } } );
  return retComments.results[0] ? retComments.results[0].value.count: 0;
}
// End

/*
// Function to get the number of UGC content items per user.
function getUGCCount(aid) {
  var retUGCCount = db.artist_updates.mapReduce( ugcMap, ugcReduce, { out: { inline: 1 }, query: { user_id: { $exists: true }, artist_id: aid } } );
  var counter = 0;
  retUGCCount.results.forEach( function(cell) {
    counter += cell.value.count;	
});
  return counter ? counter: 0;
}
*/
// End

// Setup table
print("<table>");
//print("<th>#</th><th>Name</th><th>Fan Connections</th><th>Likes</th><th>Comments</th><th>UGC Items</th>");
print("<th>#</th><th>Name</th><th>Fan Connections</th><th>Likes</th><th>Comments</th>");
//  Define and output the Top 100 Songbird.me artists based on follow count along with their total likes and ugc items.
var top100 = db.artists.find().sort({ tfc: -1 }).limit(100);
var top100i = 1;
top100.forEach( function(cell) {
  print("<tr>")
  //print("<td>" + top100i + "</td><td>" + cell.artist_name + "</td><td>" + addCommas(cell.tfc) + "</td><td>" + addCommas(getLikes(cell._id)) + "</td><td>" + addCommas(getComments(cell._id)) + "</td><td>" + addCommas(getUGCCount(cell._id)) + "</td>");
  print("<td>" + top100i + "</td><td>" + cell.artist_name + "</td><td>" + addCommas(cell.tfc) + "</td><td>" + addCommas(getLikes(cell._id)) + "</td><td>" + addCommas(getComments(cell._id)) + "</td>");
  top100i ++;
});
  print("</tr>")
// End Soundboard Top 100 Listing

// End Report

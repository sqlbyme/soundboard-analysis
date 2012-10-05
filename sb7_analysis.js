/*
 * Updated by ME
 *
 * This js file is used in conjunction with a call to the mongo database
 * soundboard-production.  This will run the following queries and produce
 * an output which is then emailed to users associated with the
 * dailyreports_sb7@songbirdnest.com distribution list.
 *
 * The job that calls this file is run from the jenkins instance on the carson.songbirdnest.com server.
 * The job is labeled soundboard-sb7-daily-report-process.
 *
 * if you have questions/comments about this file or the job that runs it please contatc
 * mike@songbirdnest.com.
 *
 * if mike does not work here anymore and this job is still running and being used on a daily 
 * basis...trust me, you've got much bigger problems than dealing with this file.  Good luck! :)
 *
 */

/*
 * Change Log
 * 10-1-12 - me - Initial file setup for Daily SB7 Report
 */

//Display Report Header

// First we need to determine if it is before or after noon
function IsAM(d) {
   return (d.getHours() < 12 ? true : false);
}

// Output the report header
print("******************************");
IsAM(new Date()) ? print("Songbird 7 Daily Stats" ) : print("Songbird 7 Daily Stats");
print(new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString());
print("******************************");

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

// This is the array of artists in the SB7 program.
 var sb7List = [ ObjectId("4ff073ab2aa6050001000a04"),
                 ObjectId("4f91f8dbdd3390000100003f"),
                 ObjectId("4fc48ffea1ecd600010001cc"),
                 ObjectId("502240a7d0fbde0002000afd"),
                 ObjectId("4ff228e71cd3630001000392"),
                 ObjectId("4f976138491b840001000289"),
                 ObjectId("5010313f0b9f030002000d52") ];

// These vars set the current year and month and then set the date based upon 
// whether or not it is before noon. Could probably remove the IsAM check
// based on the fact that we no longer run the report twice a day.
var year = new Date().getFullYear().toString();
var yesterday = IsAM(new Date()) ? new Date().getDate()-1 : new Date().getDate();
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

// Function to get the Artist name given a particular artist id.
function getName(aid) {
  var retName = db.artists.findOne( { _id: ObjectId(aid) } );
  return retName.artist_name;
}

// Start Soundboard SB7 listing

// Function to get the number of likes per artist
function getLikes(aid) {
  var retLikes = db.artist_updates.mapReduce( likesMap, likesReduce, { out: { inline: 1 }, query: { artist_id: ObjectId(aid) } } );
  return retLikes.results[0] ? retLikes.results[0].value.count: 0;
}
// End

// Function to get the number of UGC content items per user.
function getUGCCount(aid) {
  var retUGCCount = db.artist_updates.mapReduce( ugcMap, ugcReduce, { out: { inline: 1 }, query: { user_id: { $exists: true }, artist_id: ObjectId(aid) } } );
  return retUGCCount.results[0] ? retUGCCount.results[0].value.count: 0;
}
// End

//  Define and output the Top 100 Songbird.me artists based on follow count along with their total likes and ugc items.
var sb7 = db.artists.find( { _id: { $in: sb7List } } ).sort({ tfc: -1 }).limit(7);
var sb7i = 1;
sb7.forEach( function(cell) {
  print(sb7i + ": " + cell.artist_name + " - " + addCommas(cell.tfc) + " fan connections - " + addCommas(getLikes(cell._id)) + " like(s) - " + addCommas(getUGCCount(cell._id)) + " ugc item(s).");
  sb7i ++;
});
// End Soundboard SB7 Listing

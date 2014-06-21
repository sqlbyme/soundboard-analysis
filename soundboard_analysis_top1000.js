/*
 * Created by ME
 *
 *
 * This js file is used in conjunction with a call to the mongo database
 * soundboard-production.  This will run the following queries and produce
 * an output which is then emailed to users associated with the
 * dailyreports@songbirdnest.com distribution list.
 *
 * The job that calls this file is run from the jenkins instance on the jenkins.songbirdnest.com server.
 * The job is labeled soundboard-daily-report-top1000-process.
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
 * 05-09-13 - me - Initial creation.  Based on the soundboard_analysis.js file.
 */

// Format Report Email Header

print("Mime-Version: 1.0");
print("Content-Type: text/html");
print("To: mike@songbirdnest.com");
print("Subject: Soundboard Top 1000");


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

// Start Soundboard Top 1000 listing

var artistCount = db.artists.find( { disabled: { $ne: true } } ).count();

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

// Output the section header
print("Soundboard Top 1000 Connections of " + addCommas(artistCount) + " Artists!<br/>");

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

// Output the report header
print("<br/>******************************<br/>");
print("Soundboard Top 1000 Artists<br/>" );
print(new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString() + "<br/>");

// Setup table
print("<table>");
//print("<th>#</th><th>Name</th><th>Fan Connections</th><th>Likes</th><th>Comments</th><th>UGC Items</th>");
print("<th>#</th><th>Name</th><th>Fan Connections</th><th>Likes</th><th>Comments</th>");
//  Define and output the Top 100 Songbird.me artists based on follow count along with their total likes and ugc items.
var top1000 = db.artists.find().sort({ tfc: -1 }).limit(1000);
var top1000i = 1;
top1000.forEach( function(cell) {
  print("<tr>")
  print("<td>" + top1000i + "</td><td>" + cell.artist_name + "</td><td>" + addCommas(cell.tfc) + "</td><td>" + addCommas(getLikes(cell._id)) + "</td><td>" + addCommas(getComments(cell._id)) + "</td>");
  top1000i ++;
});
  print("</tr>");
  print("/table");
// End Soundboard Top 1000 Listing

// End Report

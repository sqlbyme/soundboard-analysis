/*
 * Created by ME
 *
 * This js file is used in conjunction with a call to the mongo database
 * soundboard-production.  This will run the following queries and produce
 * an output which is then emailed to users associated with the
 * dailyreports@songbirdnest.com distribution list.
 *
 * The job that calls this file is run from the jenkins instance on the jenkins.songbirdnest.com server.
 * The job is labeled soundboard-daily-report-process.
 *
 * if you have questions/comments about this file or the job that runs it please contact
 * mike@songbirdnest.com.
 *
 * if Mike does not work here anymore and this job is still running and being used on a daily
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
 * 03-07-13 - me - commented out the UGC and Email Poll portios of the report.
 * 03-14-13 - me - I went through a major refactor of the searchStart and searchEnd date code and the Engagement numbers query.
 * 04-11-13 - me - Added the New Users by account type counts to report.
 * 05-02-13 - me - Added the PharCyde daily touchpoint count to the report.
 * 05-04-13 - me - Refactored Touchpoints logic to make it dynamic. Now when new touchpoints are added we should not have to update the report.
 * 05-06-13 - me - Refactored some of the var logic and added a master list of touchpoints.  If a new touchpoint is detected it will display as a 0
 *                 count the first time until it is added to the master listing.  This allows us to report a zero count when a touchpoint does not
 *                 appear in a subsequent daily report.
 */

// Format Report Email Header
  print("Mime-Version: 1.0");
  print("Content-Type: text/html");
  print("To: dailyreports@songbirdnest.com");
  print("Subject: Daily Soundboard Stats");

// Output the report header
  print("<br/>******************************<br/>");
  print("Soundboard Daily Stats<br/>" );
  print(new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString() + "<br/>");
  print("******************************<br/>");

// We use this function for some formatting on in the printed report.
  function capitaliseFirstLetter(string)
  {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

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
var total_tiles_collected = db.user_tiles.find().count(),
    user_count = db.user_tiles.distinct("user_id").length;
// end section

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
// End addLeadingZero

// Set the start and end dates to search between
  var searchStart = new Date(ISODate() - 86000000),
      searchEnd = new Date(ISODate());

  searchStart.setHours(0, 7, 0, 0);
  searchEnd.setHours(0, 6, 59, 999);
// End dates

// Setup the map / reduce for the Touchpoints
  function touchpointMap () {
    emit ( this.touchpoints[0].touchpoint, { count: 1 });
  }
  // End Map

  function touchpointReduce (key, values) {
    var total = 0;
    for ( var i=0; i<values.length; i++ ) {
      total += values[i].count;
    }
    return { count : total };
  }
  // End reduce
//End Map/Reduce - Touchpoints

// Setup the map / reduce for Likes
  function likesMap () {
    emit ( this.artist_id, { count: this.like_count });
  }
  //End Map

  function likesReduce (key, values) {
    var total = 0;
    for ( var i=0; i<values.length; i++ ) {
      total += values[i].count;
    }
    return { count: total };

  }
  // End Reduce
//End Map/Reduce - Likes

// Setup the map / reduce for Comments
  function commentsMap () {
    emit ( this.artist_id, { count: this.comment_count });
  }
  // End Map

  function commentsReduce (key, values) {
    var total = 0;
    for ( var i=0; i<values.length; i++ ) {
      total += values[i].count;
    }
    return { count: total };
  }
  // End Reduce
// End Map/Reduce Comments

  // Function to get the Artist name given a particular artist id.
  function getName(aid) {
    var retName = db.artists.findOne( { _id: ObjectId(aid) } );
    return retName.artist_name;
  }
  // End getName

// Set the vars to prep them for output.
  // Artist Count
  var artistCount = db.artists.find( { disabled: { $ne: true } } ).count(),
      diasbledArtistCount = db.artists.find( { disabled: true } ).count();
  // End Artist Count

  // User Count
  var total_users = db.users.find( { created_at: { $lte: searchEnd } } ).count();
  // End User Count
// End Setup

// Touchpoints
  var resultsJSON = db.user_touchpoints.mapReduce (touchpointMap, touchpointReduce, {out: { inline : 1}, query: { "touchpoints.0.created_at" : { $gte: searchStart, $lt: searchEnd } } } );

  var all = ["android","bittorrent","desktop","ios","web"],
      current = [],
      missing = [];

  // We use this function to parse out each touchpoint and display it in the report.
  function displayTouchpoints (resultSet) {
    resultSet.results.forEach(function(entry) {
      print(capitaliseFirstLetter(entry._id) + " Touchpoints: " + addCommas(entry.value.count) + "<br />");
      current.push(entry._id);
    });
    all.forEach(function(entry) {
      if (current.indexOf(entry) === -1) { missing.push(entry); }
    });
    missing.forEach(function(entry) {
      print(capitaliseFirstLetter(entry) + " Touchpoints: 0<br />");
    });
  }
  // End displayTouchpoints

  // CalculateTotalTouchpoints
  function caclulateTotalTouchpoints (resultSet) {
    var i = 0;
    resultSet.results.forEach(function(entry) {
      i += entry.value.count;
    });
    return i;
  }
  // End CalculateTotalTouchpoints

  var total_touchpoints = caclulateTotalTouchpoints(resultsJSON);
// End Touchpoints

// Likes
  var likesJSON = db.artist_updates.mapReduce( likesMap, likesReduce, { out: { inline: 1 }, query: { like_count: { $gte: 1 } } } ),
      likesCounter = 0;
  likesJSON.results.forEach( function(cell) { likesCounter += cell.value.count; });
// End Likes

// Comments
  var commentsJSON = db.artist_updates.mapReduce( commentsMap, commentsReduce, { out: { inline: 1 }, query: { comment_count: { $gte: 1 } } } ),
      commentsCounter = 0;
  commentsJSON.results.forEach( function(cell) { commentsCounter += cell.value.count; });
// End Comments

// Engadgement
  var newUsers = db.users.find( { created_at: { $gte: searchStart, $lte: searchEnd } } ).count(),
      returningUsers = db.users.find( { afa: { $gte: searchStart, $lte: searchEnd }, created_at: { $lt: searchStart } } ).count(),
  activeUsers = newUsers + returningUsers;
// End Engadgment

// User Count by auth type
  var emailUsers = db.users.find({"accounts._id": null, created_at: { $gte: searchStart, $lte: searchEnd}}).count(),
      fbUsers = newUsers - emailUsers,
  gmailUsers = db.users.find({'accounts.provider' : 'gplus', created_at: { $gte: searchStart, $lte: searchEnd}}).count();
// End User Count

// Output results to the body of an email
  print("Total Registered Users: " + addCommas(total_users) + "<br />");
  print("New Users: " + addCommas(newUsers) + "<br />");
  print("Active Users: " + addCommas(activeUsers) + "<br />");
  print("Returning Users: " + addCommas(returningUsers) + "<br />");
  print("Total Artist to Fan Connections: " + addCommas(total_tiles_collected) + "<br />");
  print("Number of Users Connecting to an Artist: " + addCommas(user_count) + "<br />");
  print("Avg Number of Artist Connections / User: " + addCommas((total_tiles_collected/user_count).toFixed(2)) + "<br />");
  print("Total Likes: " + addCommas(likesCounter) + "<br />");
  print("Total Comments: " + addCommas(commentsCounter) + "<br />");
  print("******************************<br />");
  print("Touchpoints Count - if report is run before 12:00 counts are previous day.<br />");
    displayTouchpoints(resultsJSON);
  print("Total Touchpoints: " + addCommas(total_touchpoints) + "<br />");
  print("******************************<br />");
  print("New Users by Account Type.<br />");
  print("Facebook: " + addCommas(fbUsers) + "<br />");
  print("Email: " + addCommas(emailUsers) + "<br />");
  print("Gmail: " + addCommas(gmailUsers) + "<br />");
  print("******************************<br />");
//End Email Body

// Start Soundboard Top 100 listing

  // Output the section header
  print("Soundboard Top 100 Connections of " + addCommas(artistCount) + " Artists!<br/>");
  print("<br/>");
  //End header

  // Function to get the number of likes per artist
  function getLikes(aid) {
    var retLikes = db.artist_updates.mapReduce( likesMap, likesReduce, { out: { inline: 1 }, query: { artist_id: aid } } );
    return retLikes.results[0] ? retLikes.results[0].value.count: 0;
  }
  // End getLikes

  // Function to get the number of comments per artist
  function getComments(aid) {
    var retComments = db.artist_updates.mapReduce( commentsMap, commentsReduce, { out: { inline: 1 }, query: { artist_id: aid } } );
    return retComments.results[0] ? retComments.results[0].value.count: 0;
  }
  // End getComments

// Setup table
  print("<table>");
  print("<th>#</th><th>Name</th><th>Fan Connections</th><th>Likes</th><th>Comments</th>");

  //  Define and output the Top 100 Songbird.me artists based on follow count along with their total likes and ugc items.
  var top100 = db.artists.find().sort({ tfc: -1 }).limit(100);
  var top100i = 1;
  top100.forEach( function(cell) {
    print("<tr>")
    print("<td>" + top100i + "</td><td>" + cell.artist_name + "</td><td>" + addCommas(cell.tfc) + "</td><td>" + addCommas(getLikes(cell._id)) + "</td><td>" + addCommas(getComments(cell._id)) + "</td>");
    top100i ++;
  });
  print("</tr>")
// End table
// End Soundboard Top 100 Listing

// End Report

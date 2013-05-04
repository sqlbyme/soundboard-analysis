/*
 * Created by ME & AS
 * 
 *
 * This js file is used in conjunction with a call to the mongo database
 * soundboard-production.  This will run the following queries and produce
 * an output which is then emailed to users associated with the
 * dailyreports-tpa@songbirdnest.com distribution list.
 *
 * The job that calls this file is run from the jenkins instance on the jenkins.songbirdnest.com server.
 * The job is labeled soundboard-daily-report-tp-process.
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
 * 05-04-13 - me - Initial build of the report.
 */

// Format Report Email Header

print("Mime-Version: 1.0");
print("Content-Type: text/html");
print("To: dailyreports-tpa@songbirdnest.com");
print("Subject: Daily Soundboard Touchpoint Analysis");

// Output the report header
print("<br/>******************************<br/>");
print("Daily Soundboard Touchpoint Analysis<br/>" );
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

// Set the start and end dates to search between
var searchStart = new Date(ISODate() - 86000000);
var searchEnd = new Date(ISODate());
searchStart.setHours(0, 7, 0, 0);
searchEnd.setHours(0, 6, 59, 999);

// First we need an array of touchpoints to analyze
var touchpoints = db.user_touchpoints.distinct('touchpoints.0.touchpoint').sort();

// Now we need a function to iterrate through the array of touchpoints and
// then output a table of locations by gender for each touchpoint.

function queryTouchpoints(touchpointList) {
  touchpointList.forEach(function(entry) {
    // First we need to build a list of UserIDs for a given touchpoint in a given period
    var UIDs = db.user_touchpoints.find( { "touchpoints.0.created_at" : { $gte: searchStart, $lt: searchEnd }, "touchpoints.0.touchpoint" : entry } );
    var uidArray = [];
    UIDs.forEach(function(entry){ uidArray.push(entry.user_id)  });
    
    // Setup the map / reduce for the Touchpoints
    function locationMap () {
      emit ( this.location, { count: 1 });

    }

    function locationReduce (key, values) {
      var total = 0;
      for ( var i=0; i<values.length; i++ )
        total += values[i].count;
      return { count : total };
    }
    
    // Touchpoints
    var locationJSONMale = db.users.mapReduce( locationMap, locationReduce, {out: {inline: 1 }, query: { _id: { $in: uidArray }, location: { $exists: true }, gender: "male" } } );
    var locationJSONFemale = db.users.mapReduce( locationMap, locationReduce, {out: {inline: 1 }, query: { _id: { $in: uidArray }, location: { $exists: true }, gender: "female" } } );
    
    // We use this function to parse out each touchpoint and display it in the report.
    function displayLocationValues (resultSet) {
       resultSet.results.forEach(function(entry) {
          var name = entry._id? entry._id : "N/A";
          print("<tr><td></td><td></td><td>" + capitaliseFirstLetter(name) + "</td><td>" + addCommas(entry.value.count) + "</td></tr>");

        });
     }
    
    print("<tr><td>" + entry + "</td><td></td><td></td><td></td></tr>");
    print("<tr><td></td><td>Female</td><td></td><td></td></tr>");
    displayLocationValues(locationJSONFemale);
    print("<tr><td></td><td>Male</td><td></td><td></td></tr>");
    displayLocationValues(locationJSONMale);
  });
}






// Setup table
print("<table border=\"1\">");
print("<th>Touchpoint</th><th>Gender</th><th>Location</th><th>Count</th>");

// Fill the table with data
queryTouchpoints(touchpoints);

print("</table>");

// End Report

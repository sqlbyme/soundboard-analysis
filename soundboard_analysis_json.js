/*
 * Created by ME
 *
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
 * 5-18-12 - me - stripped out visual printing functionality and refactored to output json data
 */

//Display Report Header

// First we need to determine if it is before or after noon
function IsAM(d)
{
   return (d.getHours() < 12 ? true : false);
}

var tbHeader = IsAM(new Date()) ? "Soundboard Morning Stats" : "Soundboard Afternoon Stats";
var tbDateTime = new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString();
var jsonOut = {};
jsonOut.Report = { "Title" : tbHeader, "Timestamp" : tbDateTime };


// This is the addCommas function
 function addCommas(nStr)
 {
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


total_users = db.users.count();

collections_per_user = db.user_tiles.group(
    { key: { user_id: true },
      cond: { bucket: 1 },
      reduce: function(obj,out) {
                out.count += 1;
              },
      initial: { count: 0 }
    });

total_tiles_collected = db.user_tiles.find({ bucket: 1 }).count();


var user_count = 0,
    collection_count = 0;

function printColl(coll) {
  user_count += 1;
  collection_count += coll["count"];
}
var shares_per_user = db.user_actions.group(
    { key: { user_id: true },
      cond: { action: 0 },
      reduce: function(obj,out) {
                out.count += 1;
              },
      initial: { count: 0 }
    });

collections_per_user.forEach(printColl);
jsonOut.Data = [];
jsonOut.Data.push( { "Total users" : addCommas(total_users) } );
jsonOut.Data.push( { "Total artists followed" : addCommas(total_tiles_collected) } );
jsonOut.Data.push( { "Number of users following an artist" : addCommas(user_count) } );
jsonOut.Data.push( { "Avg number of artists followed" : addCommas((collection_count/user_count).toFixed(2)) } );


var artistCount = db.artist_metadata.count();

jsonOut.top100 = [];
var top100 = db.artists.find({}, { _id: 0}).sort({ tfc: -1}).limit(100);
var top100i = 1;
top100.forEach( function(cell) {
  jsonOut.top100.push( { "Rank" : top100i, "Artist" : cell.artist_name, "Followers" : cell.tfc } );
  top100i ++;
});

printjson(jsonOut);

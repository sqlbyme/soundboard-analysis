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
 */

//Display Report Header

// First we need to determine if it is before or after noon
function IsAM(d)
{
   return (d.getHours() < 12 ? true : false);
}

print("******************************");
IsAM(new Date()) ? print("Soundboard Morning Stats" ) : print("Soundboard Afternoon Stats");
print(new Date().toLocaleDateString() + " @ " + new Date().toLocaleTimeString());
print("******************************");

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
      reduce: function(obj,out) {
                out.count += 1;
              },
      initial: { count: 0 }
    });

total_tiles_collected = db.user_tiles.find({}).count();


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

print("Total users: " + addCommas(total_users));
print("Total artists followed: " + addCommas(total_tiles_collected));
print("Number of users following an artist: " + addCommas(user_count));
print("Avg number of artists followed: " + addCommas((collection_count/user_count).toFixed(2)));
print("******************************");




// Start Soundboard Top 100 listing
print();
print("******************************");

var artistCount = db.artist_metadata.count();

print("Soundboard Top 100 of " + addCommas(artistCount));
print("Followed Artists");
print();

var top100 = db.artist_metadata.find({}, { _id: 0}).sort({ "value.followed": -1}).limit(100);
var top100i = 1;
top100.forEach( function(cell) {
  print(top100i + ": " + cell.value.artist + " - " + cell.value.followed + " followers.");
  top100i ++;
});
// End Soundboard Top 100 Listing

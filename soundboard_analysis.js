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
 *
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

print("Total users: " + addCommas(total_users));
print("Total artists followed: " + addCommas(total_tiles_collected));
print("Number of users following an artist: " + addCommas(user_count));
print("Avg number of artists followed: " + addCommas((collection_count/user_count).toFixed(2)));
print("******************************");


/*
// Reset user and collection counts prior to counting shares
user_count = collection_count = 0;
shares_per_user.forEach(printColl);
print("Number of shares: " + addCommas(collection_count));
print("Number of users who shared a tile: " + addCommas(user_count));
print("Avg shares: " + addCommas((collection_count/user_count).toFixed(2)));

//This is the Collection Action Stats Section
tiles_from_friends = db.user_actions.find({action:1, source:1}).count();
tiles_from_feed = db.user_actions.find({action:1, source:0}).count();
tiles_from_search = db.user_actions.find({action:1, source:4}).count();
num_dismissed = db.user_actions.find( { action : 2 } ).count();

print("Total artists followed from Discover: " + addCommas(tiles_from_feed));
print("Total artists followed from Search: " + addCommas(tiles_from_search));
print("Total artists followed from Friends: " + addCommas(tiles_from_friends));
print("Total artist tiles dismissed: " + addCommas(num_dismissed));

//This is the Invitations stats
var num_invites = db.user_actions.find( { action : 10, source : 10 } ).count();
rint("Number of Invitations Sent: " + addCommas(num_invites));
*/

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

/*
var mapF = function () {
      emit(db.tiles.find(this.tile_id)[0].artist_name, 1);
    },
    reduceF = function (key, values) {
      var total = 0;
      values.forEach(function (val) {
        total += val;
      });

     return total;
   },
   rank = 1;

 db.user_tiles.mapReduce(mapF, reduceF, { query: { bucket: 1 },  out: "top_follow_results" });
 db.top_follow_results.find().sort({ value: -1 }).limit(100).forEach(function (f) {
   print(rank++ + '. ' + f._id + ' (' + f.value +  ' follows)');
 });
 db.top_follow_results.drop();
*/
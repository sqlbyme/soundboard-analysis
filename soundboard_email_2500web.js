/*  Created - ME - 05/10/13@144600
    
    This file is for selecting out 2500 soundboard users to create a 
    quick ad-hoc email list on mailchimp.
    
*/


function getEmails() {
  
  //Set the search date from
  //var searchStart = new Date(ISODate() - 7777600000); // 90 Days
  var searchStart = new Date(ISODate() - 1900800000); // 22 Days
  
  // First we need to build a list of UserIDs for a given touchpoint in a given period
  var UIDs = db.user_touchpoints.find( { $and: [ {"touchpoints.0.touchpoint" : "web"}, {"touchpoints.0.created_at": { $gte: searchStart }}] });
  var uidArray = [];
  UIDs.forEach(function(entry){ uidArray.push(entry.user_id)  });
  
  print("Total Selection Pool: " + uidArray.length);
  
  var Emails = db.users.find({ $and: [ {_id: {$in: uidArray }}, {location: { $ne: null }}] }, {name: 1, l_n: 1, email: 1, location: 1}).limit(2500);
  print("Total Available Emails: " + Emails.count());
  Emails.forEach(function(entry) { print(entry.l_n + "," + entry.name + "," + entry.email + "," + entry.location); });
  
}

getEmails();
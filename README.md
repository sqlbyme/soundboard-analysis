soundboard-analysis
===================

Contains js files which are used in automated reports run on the soundboard db

==================

Change Log:
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
* 03-14-13 - as & me - Andreas and I went through a major refactor of the searchStart and searchEnd date code and the Engagement numbers query.
* 04-11-13 - me & as - Added the New Users by account type counts to report.
* 05-02-13 - me & as - Added the PharCyde daily touchpoint count to the report.
* 05-04-12 - me - Refactored Touchpoints logic to make it dynamic. Now when new touchpoints are added we should not have to update the report.

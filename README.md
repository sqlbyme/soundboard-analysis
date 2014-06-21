#soundboard-analysis

## Description

- The purpose of these scripts are to provide daily reporting and metrics on soundboard activities.

## Change Log
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


## Dependencies
* You will need to setup an rvm environment running ruby-1.9.3-p194.
  * You will also need to create a gemset called `gsb-automation`
    * note: make sure you remember to issue `rvm use ruby-1.9.3-p194@gsb-automation --create` from the command line.
    * remember to create a .rvmrc file which contains one line: `rvm use ruby-1.9.3-p194@gsb-automation`


## Setup
1. Clone the Repo: Run `git clone git@github.com:sqlbyme/gsb-automation.git`
2. Install the dependencies
3. Run `gem install bundler`
4. Run `bundle install`
5. Run `bundle exec rake gsb`

## Branches

This repo consists of one branch, currently it is:
  1. checkin

#### Pushing
To push to each app you'll need to do the following:

##### soundboard-analysis:
      git remote add origin git@github.com:sqlbyme/soundboard-analysis.git
      git push origin checkin

## License

This application is released under the MIT license:

* http://www.opensource.org/licenses/MIT

The MIT License (MIT)

Copyright (c) 2014 Michael Edwards - sqlby.me

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

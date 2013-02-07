function checkRequirements()
{
   if (navigator.network.connection.type == Connection.NONE)
   {
      navigator.notification.alert(
         'To use this app you must enable your internet connection',
         function(){},
         'Warning'
      );
      return false;
   }

   return true;
}

function updateIcons()
{
   if ($(window).width() > 480)
   {
      $('a[data-icon], button[data-icon]').each(
         function()
         {
            $(this).removeAttr('data-iconpos');
         }
      );
   }
   else
   {
      $('a[data-icon], button[data-icon]').each(
         function()
         {
            $(this).attr('data-iconpos', 'notext');
         }
      );
   }
}

function urlParam(name)
{
   var results = new RegExp('[\\?&amp;]' + name + '=([^&amp;#]*)').exec(window.location.href);
   if (results != null && typeof results[1] !== 'undefined')
      return results[1];
   else
      return null;
}

/**
 * Create the positions' history list
 */
function createPositionsHistoryList(idElement, positions) {
    if (positions == null || positions.length == 0)
        return;

    $('#' + idElement).empty();
    var $listElement, $linkElement, dateTime;
    for (var i = 0; i < positions.length; i++) {
        $listElement = $('<li>');
        $linkElement = $('<a>');
        $linkElement
        .attr('href', '#')
        .click(
           function () {
               if (checkRequirements() === false)
                   return false;

               $.mobile.changePage(
                  'map.html',
                  {
                      data: {
                          requestType: 'get',
                          index: $(this).closest('li').index()
                      }
                  }
               );
           }
        );

        if (positions[i].address == '' || positions[i].address == null)
            $linkElement.text('Address not found');
        else
            $linkElement.text(positions[i].address);

        dateTime = new Date(positions[i].datetime);
        $linkElement.text(
           $linkElement.text() + ' @ ' +
           dateTime.toLocaleDateString() + ' ' +
           dateTime.toLocaleTimeString()
        );

        // Append the link to the <li> element
        $listElement.append($linkElement);

        $linkElement = $('<a>');
        $linkElement.attr('href', '#')
        .text('Delete')
        .click(
           function () {
               var position = new Position();
               var oldLenght = position.getPositions().length;
               var $parentUl = $(this).closest('ul');

               position.deletePosition($(this).closest('li').index());
               if (oldLenght == position.getPositions().length + 1) {
                   $(this).closest('li').remove();
                   $parentUl.listview('refresh');
               }
               else {
                   navigator.notification.alert(
                      'Position not deleted. Something gone wrong so please try again.',
                      function () { },
                      'Error'
                   );
               }

           }
        );
        // Append the link to the <li> element
        $listElement.append($linkElement);

        // Append the <li> element to the <ul> element
        $('#' + idElement).append($listElement);
    }
    $('#' + idElement).listview('refresh');
}


/*************************************************************
* OLD APP
*/

var dbShell;

function doLog(s) {
    
    setTimeout(function(){
        console.log(s);
    }, 3000);
    
}


//Wrapper for alert so I can dynamically use PhoneGap alert's on device
function doAlert(str, cb) {
    if (cb) cb();
}

function dbErrorHandler(err) {
    //alert("DB Error: " + err.message + "\nCode=" + err.code);

    try {
        doLog("dbErrorHandler WebSql Error: " + err.message + "\nCode=" + err.code);
    } catch (e) {
        doLog("dbErrorHandler Parse Error: " + err);
    }
}

function phoneReady() {
    doLog("phoneReady");
    //First, open our db

    dbShell = window.openDatabase("SimpleDreamLog", 2, "SimpleDreamLog", 1000000);
    doLog("db was opened");
    //run transaction to create initial tables
    dbShell.transaction(setupTable, dbErrorHandler, getEntries);
    doLog("ran setup");
}

//I just create our initial table - all one of em
function setupTable(tx) {
    doLog("before execute sql...");
    tx.executeSql("CREATE TABLE IF NOT EXISTS dreams(id INTEGER PRIMARY KEY,title,body,updated)");
    doLog("after execute sql...");
}

//I handle getting entries from the db
function getEntries() {
        if (online)
        {
            doLog("Going to get entries from Parse");
            var DreamObject = Parse.Object.extend("dream");
            
            var query = new Parse.Query(DreamObject);
            query.find({
                success: function (results) {
                    renderParseEntries(results);
                },
                error: dbErrorHandler
            });

        }
        else {
            doLog("get entries");
            dbShell.transaction(function (tx) {
                tx.executeSql("select id, title, body, updated from dreams order by updated desc", [], renderEntries, dbErrorHandler);
            }, dbErrorHandler);
        }
}

function renderParseEntries(results) {
    doLog("render entries");
    if (results.length == 0) {
        $("#mainContent").html("<p>You currently do not have any dream recorded.</p>");
    } else {
        var s = "";
        for (var i = 0, len = results.length; i < len; i++) {
            var result = results[i];
           // doLog(result.id);
            //doLog(result.objectId);
            /*s += '<p>';
            s += '<b>ID:</b> ' + result.id + '<br/>';
            s += 'Created: ' + result.createdAt + '<br/>';
            s += 'Title: ' + result.attributes.title + '<br/>';
            s += 'Description: ' + result.attributes.description + '<br/>';
            s += '</p>';*/
            
            s += "<li><a href='dreamLogEntrie.html?id=" + result.id + "'>" + result.attributes.title + "</a></li>";
        }
        $("#dreamTitleList").html(s);
        $("#dreamTitleList").listview("refresh");
    }
}

function renderEntries(tx, results) {
    doLog("render entries");
    if (results.rows.length == 0) {
        $("#mainContent").html("<p>You currently do not have any dream recorded.</p>");
    } else {
        var s = "";
        for (var i = 0; i < results.rows.length; i++) {
            s += "<li><a href='dreamLogEntrie.html?id=" + results.rows.item(i).id + "'>" + results.rows.item(i).title + "</a></li>";
        }
        $("#dreamTitleList").html(s);
        $("#dreamTitleList").listview("refresh");
    }
}

/**
 * Initialize the application
 */
/*
function initApplication()
{
   $('#set-car-position, #find-car').click(function() {
      if (checkRequirements() === false)
      {
         $(this).removeClass('ui-btn-active');
         return false;
      }
   });
   $(document).on('pagebeforecreate orientationchange', updateIcons);
   $('#map-page').live(
      'pageshow',
      function()
      {
         var requestType = urlParam('requestType');
         var positionIndex = urlParam('index');
         var geolocationOptions = {
            timeout: 15 * 1000, // 15 seconds
            maximumAge: 10 * 1000, // 10 seconds
            enableHighAccuracy: true
         };
         var position = new Position();

         $.mobile.loading('show');
         // If the parameter requestType is 'set', the user wants to set
         // his car position else he want to retrieve the position
         if (requestType == 'set')
         {
            navigator.geolocation.getCurrentPosition(
               function(location)
               {
                  // Save the position in the history log
                  position.savePosition(
                     new Coords(
                        location.coords.latitude,
                        location.coords.longitude,
                        location.coords.accuracy
                     )
                  );
                  // Update the saved position to set the address name
                  Map.requestLocation(location);
                  Map.displayMap(location, null);
                  navigator.notification.alert(
                     'Your position has been saved',
                     function(){},
                     'Info'
                  );
               },
               function(error)
               {
                  navigator.notification.alert(
                     'Unable to retrieve your position. Is your GPS enabled?',
                     function(){
                        alert("Unable to retrieve the position: " + error.message);
                     },
                     'Error'
                  );
                  $.mobile.changePage('index.html');
               },
               geolocationOptions
            );
         }
         else
         {
            if (position.getPositions().length == 0)
            {
               navigator.notification.alert(
                  'You have not set a position',
                  function(){},
                  'Error'
               );
               $.mobile.changePage('index.html');
               return false;
            }
            else
            {
               navigator.geolocation.watchPosition(
                  function(location)
                  {
                     // If positionIndex parameter isn't set, the user wants to retrieve
                     // the last saved position. Otherwise he accessed the map page
                     // from the history page, so he wants to see an old position
                     if (positionIndex == undefined)
                        Map.displayMap(location, position.getPositions()[0]);
                     else
                        Map.displayMap(location, position.getPositions()[positionIndex]);
                  },
                  function(error)
                  {
                     console.log("Unable to retrieve the position: " + error.message);
                  },
                  geolocationOptions
               );
            }
         }
      }
   );
   $('#positions-page').live(
      'pageinit',
      function()
      {
         createPositionsHistoryList('positions-list', (new Position()).getPositions());
      }
   );
}
*/


function initApplication() {
    document.addEventListener("deviceready", phoneReady, false);

    Parse.initialize("UVlewktikiK5VltsryjmuxJKyKICSgjcRNNulfFj", "g8pBOeam9isU4txJuWzewaPZJOYhMYcuTzRe5E9f");
    
    //handle form submission of a new/old dream
    $("#editDreamForm").live("submit", function (e) {
        var data = {title: $("#dreamTitle").val(),
                    body: $("#dreamBody").val(),
                    id: $("#dreamId").val()
        };
        savedreamToDB(data, function () {
            $.mobile.changePage("index.html", { transition: "slide" });
        });
        e.preventDefault();
    });

    //will run after initial show - handles regetting the list
    $("#homePage").live("pageshow", function () {
        getEntries();
    });

    //edit page logic needs to know to get old record (possible)
    $("#editDream").live("pageshow", function () {
        //get the location - it is a hash - got to be a better way
        var loc = $(this).data("url");
        if (loc.indexOf("?") >= 0) {
            var qs = loc.substr(loc.indexOf("?") + 1, loc.length);
            var dreamId = qs.split("=")[1];
            //load the values
            $("#editFormSubmitButton").attr("disabled", "disabled");

            if (online) {
                getDreamById(dreamId);
            } else
            {
                dbShell.transaction(
                    function(tx) {
                        tx.executeSql("select id,title,body from dreams where id=?", [dreamId], function(tx, results) {
                            $("#dreamId").val(results.rows.item(0).id);
                            $("#dreamTitle").val(results.rows.item(0).title);
                            $("#dreamBody").val(results.rows.item(0).body);
                            $("#editFormSubmitButton").removeAttr("disabled");
                        });
                    }, dbErrorHandler);
            }

        } else {
            $("#editFormSubmitButton").removeAttr("disabled");
        }
    });
}

function getDreamById(id) {
    doLog("going to get getDreamById by id : " + id);
    var DreamObject = Parse.Object.extend("dream");
    var query = new Parse.Query(DreamObject);
    
    query.get(id,{
        success: function (result) {
            $("#dreamId").val(result.id);
            $("#dreamTitle").val(result.get("title"));
            $("#dreamBody").val(result.get("description"));
            $("#editFormSubmitButton").removeAttr("disabled");
        },
        error: dbErrorHandler
    });
}


/**
 * Lets save the dream
 */

/*
function saveDream()
{
    doLog("Into saveDream");

		//get the editable element
    var editElem = document.getElementById("editDreamForm");
		
		//get the edited element content
		var userVersion = editElem.innerHTML;
		
		//save the content to local storage
		localStorage.userEdits = userVersion;
		
		//write a confirmation to the user
    //document.getElementById("update").innerHTML = "Edits saved!";
    
		var data = {
		    title: $("#dreamTitle").val(),
		    body: $("#dreamBody").val(),
		    id: $("#dreamId").val()
		};

		doLog("The dream is: " + data);

		savedreamToDB(data, function () {
		    $.mobile.changePage("index.html", { transition: "pop" });
		});

}*/

function savedreamToDB(dream, cb) {
    if (online) {
        //NEW DREAM => INSERT
        if (dream.id == "")
        {
            doLog("Going to record dream online");
            var DreamObject = Parse.Object.extend("dream");
            var dreamObject = new DreamObject();
            dreamObject.save({ title: dream.title, description: dream.body }, {
                success: function (object) {
                    alert("yay! it worked");
                }
            });
        }
        else {//UPDATE
            // Create the object.
            var Dream = Parse.Object.extend("dream");
            var dreamToUpdate = new Dream();

            dreamToUpdate.id = dream.id;
            //dreamToUpdate.set("title", dream.title);
            //dreamToUpdate.set("description", dream.body);

            doLog("Going to update dream in the PARSE cloud");
            dreamToUpdate.save(null, {
                success: function (dreamToUpdate) {
                    // Now let's update it with some new data. In this case, only cheatMode and score
                    // will get sent to the cloud. playerName hasn't changed.
                    dreamToUpdate.set("title", dream.title);
                    dreamToUpdate.set("description", dream.body);
                    dreamToUpdate.save();
                }
            });
        }
        
    }
    else {
        doLog("Going to record dream offLine");
        //Sometimes you may want to jot down something quickly....
        if (dream.title == "") dream.title = "[No Title]";
        dbShell.transaction(function (tx) {
            if (dream.id == "") tx.executeSql("insert into dreams(title,body,updated) values(?,?,?)", [dream.title, dream.body, new Date()]);
            else tx.executeSql("update dreams set title=?, body=?, updated=? where id=?", [dream.title, dream.body, new Date(), dream.id]);
        }, dbErrorHandler, cb);
    }    
}

//I just create our initial table - all one of em
function setupTable(tx) {
    
    doLog("Going to create the table if it dosent exist");
     tx.executeSql("CREATE TABLE IF NOT EXISTS dreams(id INTEGER PRIMARY KEY,title,body,updated)");
}


//Think to Organize this JS file

function online() {
    return false;
    //PG
    //return PhoneGap.online;
    //No PG . . .
    //return navigator.onLine;
}
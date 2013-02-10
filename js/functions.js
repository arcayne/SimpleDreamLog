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

function DeviceReady() {
    doLog("DeviceReady");
    //First, open our db

    dbShell = window.openDatabase("SimpleDreamLog", 2, "SimpleDreamLog", 1000000);
    doLog("db was opened");
    //run transaction to create initial tables
    dbShell.transaction(setupTable, dbErrorHandler, getEntries);
    doLog("ran setup");

    AppReady();
}

function AppReady() {
    initParse();

    //Am I logged in already?
    var loggedIn = AmIalreadyLoggedIn();
    if (loggedIn) {
        $.mobile.changePage("main.html", { transition: "slide" });
    } 
}

/**
 * Initialize the application
 */
function init() {
    document.addEventListener("deviceready", DeviceReady, false);
    //document.addEventListener("deviceready", deviceReady, true);
    
    //handle form submission of a new/old dream
    $("#editDreamForm").live("submit", function (e) {
        var data = {title: $("#dreamTitle").val(),
                    body: $("#dreamBody").val(),
                    id: $("#dreamId").val()
        };
        savedreamToDB(data, function () {
            $.mobile.changePage("main.html", { transition: "slide" });
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
    
    //handle form submission of a new/old dream
    $("#loginForm").live("submit", function (e) {
        e.preventDefault();
        handleLogIn();
    });
    
    $("#registerForm").live("submit", function (e) {
        e.preventDefault();
        handleRegister();
    });
}

function handleLogIn() {
    
    $("#loginstatus").html("").removeClass("errorDiv");

    //get values
    var username = $("#username").val();
    var password = $("#password").val();

    doLog("Going to log in user: " + username + " pass:  " + password);

    //do some basic validation here
    var errors = "";
    if (username === "") errors += "Username required.<br/>";
    if (password === "") errors += "Password required.<br/>";

    if (errors !== "") {
        $("#loginstatus").html(errors).addClass("errorDiv");
        return;
    }

    $("#loginstatus").html("<b>Logging in...</b>");

    if (logIn(username, password)) {
        doLog("logIn => Success!");
        $.mobile.changePage("main.html", { transition: "slide" });
    }
}

function handleRegister() {
    doLog("handleRegister");
    var form = $("#registerForm");    
    //disable the button so we can't resubmit while we wait
    $("#submitButton",form).attr("disabled","disabled");
       
    //get values
    var username = $("#usernameRegister").val();
    var password = $("#passwordRegister").val();
    var email = $("#email").val();

    doLog("Going to register user: " + username + " pass:  " + password + " email: " + email);
      
    //do some basic validation here
    var errors = "";
    if (username === "") errors += "Username required.<br/>";
    if (password === "") errors += "Password required.<br/>";
    if (email === "") errors += "Email required.<br/>";

    if (errors !== "") {
        $("#regstatus").html(errors).addClass("errorDiv");
        return;
    }

    if(SignUp(username, password, email))
    {
        doLog("SignUp => Success!");
        $.mobile.changePage("main.html", { transition: "slide" });
    }
}


//I just create our initial table - all one of em
function setupTable(tx) {
    
    doLog("Going to create the table if it dosent exist");
     tx.executeSql("CREATE TABLE IF NOT EXISTS dreams(id INTEGER PRIMARY KEY,title,body,updated)");
}

function online() {
    return false;
    //PG
    //return PhoneGap.online;
    //No PG . . .
    //return navigator.onLine;
}
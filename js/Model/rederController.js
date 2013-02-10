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

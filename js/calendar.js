$(function () {
    "use strict";
    var year = moment().tz("America/New_York")._d.getFullYear(),
        month,
        zip,
        date = moment().tz("America/New_York").format().substr(0, 10),
        events = {myEvents:[]},
        newItem,
        location,
        zips = $("#zips"),
        calledByButton = false;

    $(zips).change(function(){
        zip = zips.val().substr(zips.val().length - 5, zips.val().length);
        getCalendar();
    }).hide();

    $(".datepicker").datepicker("setDate", moment().tz("America/New_York")._d.toDateString()).datepicker({
        dateFormat: "yy-mm-dd"
    }).click(function(){
        //onDate = true;
        $("#selectDateWarning").empty();
        date = $(".datepicker").datepicker("getDate");
        if(date.toDateString() !== "Invalid Date"){
            date = date.toISOString().substr(0, 10);
        }else{
            date = null;
        }
        displayEvents();
    }).on("changeDate", function () {
        if($.isNumeric($(this).datepicker("getDate").getFullYear())) {
            year = $(this).datepicker("getDate").getFullYear();
        }
        calledByButton = false;
        getCalendar();
    });



    $("#getEvents").on("click", function () {
        $("#zipWarning").empty();
        zip = $("#zip").val();
        $("#zip").val("");
        if(isValidUSZip(zip)){
            zip = zip.substr(0, 5);
            calledByButton = true;
            getCalendar();
        }else{
            $("<span id='zipWarning'> Enter a Valid Zip Code!</span>").insertAfter("#getEvents").css("color", "red");
        }
    });

    $.ajax({
        type: "GET",
        url: "http://localhost:5984/calendar/_design/events/_view/eventsByDate",
        success: function(data, i){
            var rows = JSON.parse(data).rows;
            console.dir(rows);
            $(rows).each(function(i, row){
                console.dir(row.value.title);
                console.dir(row.value.date);
                events.myEvents.push({date: row.value.date, title: row.value.title});

            });
            displayEvents();
        }

    });

    function isValidUSZip(sZip) {
        return /^[0-9]{5}(?:-[0-9]{4})?$/.test(sZip);
    }




    function getCalendar() {
        $.ajax({
            type: "GET",
            url: "http://www.hebcal.com/hebcal/?v=1&cfg=json&nh=on&nx=on&year=" + year + "&month=x&ss=on&mf=on&c=on&zip=" + zip +"&m=72&s=on",
            success: function (data) {
                console.dir(data);
                location = data.title.substr(12);
                if(!events[location]){
                    events[location] = {};
                    events[location][year] = [];
                    $(data.items).each(function(index, item){
                        events[location][year].push(item);
                    });
                    $(zips).append("<option selected>"  + location + "</option>").show();
                    console.dir(events);
                }else if(events.hasOwnProperty(location) && !events[location].hasOwnProperty(year)){
                    events[location][year] = [];
                    $(data.items).each(function(index, item){
                        events[location][year].push(item);
                    });
                    $(zips).val(location);
                }else{
                    console.log("exists already");
                    $(zips).val(location);
                    displayEvents();
                    return;
                }
                displayEvents();
                console.log(events);
            },
            error: function (){
                if(calledByButton) {
                    $("<span id='zipWarning'> Enter a Valid Zip Code!</span>").insertAfter("#getEvents").css("color", "red");
                }
            }
        });
    }


        $("#addItemButton").on("click", function () {
            addNewItemDialog();
        });

    function addNewItemDialog(){
        console.log(date);
        $("#myModalLabel").text($(".datepicker").datepicker("getDate").toDateString());
        if(date) {
            $("#basicModal").modal().on("shown.bs.modal", function(){
                $("#newItem").focus();
            });

            $("#basicModal").modal().on("hidden.bs.modal", function(){
                displayEvents();
            });
        }else{
           $("#selectDateWarning").empty();
            $("<span id='selectDateWarning'>  Please select a date!</span>").insertAfter($("#addItemButton")).css("color", "red");
        }
    }

    function displayEvents () {
        $("#events").empty();

        if(date) {
            if(events[zips.val()]) {
                $(events[zips.val()][year]).each(function (i, event) {
                    if (event.date.substr(0, 10) === date) {
                        $("#events").append("<span class='event'>" + event.title + "</span><br>");
                    }
                });
            }

            $(events.myEvents).each(function (i, event){
                    if(event.date === date){
                        $("#events").append("<span class='event'>" + event.title + "</span><br>");
                }
            });
        }else{
            $("#events").empty();
        }

    }

    $("#save").on("click", function(){
        newItem = $("#newItem").val();
        events.myEvents.push({date: date, title: newItem});
        $("#newItem").val("");
        saveToDb(date, newItem);

    });

    $.ajax({
        type : "GET",
        url: "http://ipinfo.io",
        dataType: "jsonp",
        success: function(data){
            zip = data.postal;
            getCalendar();
        }
    });

    function saveToDb(date, title){
        $.ajax({
            type: "POST",
            url: "http://localhost:5984/calendar",
            contentType: "application/json",
            data: JSON.stringify({date:date, title:title}),
            success: function(data){
                console.log(data);
            }

        });
    }



});

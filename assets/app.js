// @author: Thomas Thompson
// @github: tomtom28
// @comment: HW 7 (Easier)


 // Initialize Firebase
var config = {
  apiKey: "AIzaSyAcsQo2o9khUU0gXNYoJVnjO0TH2JkQhgc",
  authDomain: "trainscheduler-1438d.firebaseapp.com",
  databaseURL: "https://trainscheduler-1438d.firebaseio.com",
  storageBucket: "trainscheduler-1438d.appspot.com",
  messagingSenderId: "1028735041014"
};
firebase.initializeApp(config);
var database = firebase.database();


// Firebase change found - Pull New Data as soon as a database changes
database.ref().on("value", function(snapshot) {
  
  // Clear Old Data from Browser Table
  $('.table-body-row').empty();

  // Collect updated Firebase Data
  var data = snapshot.val();

  // Parse & Scrub the Firebase Data and then Append to HTML Table
  $.each(data, function(key, value){

    // Collect variable (done for each value from Firebase)
    var trainName = value.name;
    var trainDestination = value.destination;
    var trainFreq = value.frequency;

    var trainFirstArrivalTime = value.firstArrival;
    

    // Initialize variables to be calculated
    var trainNextDeparture;
    var trainMinutesAway;


    // --------------------------------- Calculate values using Moment.js ---------------------------------
    var convertedDate = moment(new Date(trainFirstArrivalTime));
    
    // Calculate Minutes Away
      // Find How Many Minutes Ago the very First Train Departed
    var minuteDiffFirstArrivalToNow = moment(convertedDate).diff( moment(), "minutes")*(-1);

      // --------------- Sanity Check for New Train Times ---------------
      // Negative Value - If the Train never arrived yet (first arrival date is later than now)
      if(minuteDiffFirstArrivalToNow <= 0){

        // Train Departure = Current Time - First Arrival Time
        trainMinutesAway = moment(convertedDate).diff( moment(), "minutes");

        // Next Depature Time = First Departure Time (since the train has yet to come)
        trainNextDepartureDate = convertedDate;

      }
      // Otherwise, the train arrvied in the past, so do the math
      else{

        // Next Train Departure = Frequency - (remainder of minutes from last departure)
        trainMinutesAway = trainFreq - (minuteDiffFirstArrivalToNow % trainFreq);

        // Next Departure Time = Current Time + Minutes Away
        var trainNextDepartureDate = moment().add(trainMinutesAway, 'minutes');
      }
      //----------------------------------------------------------------

    // Re-Format Time to AM/PM
    trainNextDeparture = trainNextDepartureDate.format("hh:mm A");

    //-----------------------------------------------------------------------------------------------------


    // Append New HTML Table Row (done for each key from Firebase)
    var newRow = $('<tr>');
    newRow.addClass("table-body-row");

    // Create New HTML Data Cells (done for each value from Firebase)
    var trainNameTd = $('<td>');
    var destinationTd = $('<td>');
    var frequencyTd = $('<td>');
    var nextDepartureTd = $('<td>');
    var minutesAwayTd = $('<td>');

    // Add text to the HTML Data Cells
    trainNameTd.text(trainName);
    destinationTd.text(trainDestination);
    frequencyTd.text(trainFreq);
    nextDepartureTd.text(trainNextDeparture);
    minutesAwayTd.text(trainMinutesAway);

    // Append HTML Data Cells to the new Row
    newRow.append(trainNameTd);
    newRow.append(destinationTd);
    newRow.append(frequencyTd);
    newRow.append(nextDepartureTd);
    newRow.append(minutesAwayTd);

    // Append new Row to the HTML Table
    $('.table').append(newRow);

  });

});


// Submit Button Click - Collect values and Update Firebase
$("#addTrainButton").on('click', function(){

  // Collect values from the HTML Form
  var trainName = $("#nameInput").val().trim();
  var trainDestination = $("#destinationInput").val().trim();
  var trainFirstArrivalTime = $("#firstArrivalInput").val().trim();
  var trainFreq = $("#frequencyInput").val().trim();


  // --------------------------- Sanity Checks for user inputs ---------------------------
  if(trainName == "" || trainName == null){
    alert("Please enter a Train Name!");
    return false;
  }
  if(trainDestination == "" || trainDestination == null){
    alert("Please enter a Train Destination!");
    return false;
  }
  if(trainFirstArrivalTime == "" || trainFirstArrivalTime == null){
    alert("Please enter a First Arrival Time!");
    return false;
  }
  if(trainFreq == "" || trainFreq == null || trainFreq < 1){
    alert("Please enter an arrival frequency (in minutes)!" + "\n" + "It must be an integer greater than zero.");
    return false;
  }
  // ------------------------------------------------------------------------------------


  // Parse the First Arrival Time to Check if its in military time
    // Check for 5 digits and semi-colon in the right place
  if(trainFirstArrivalTime.length != 5 || trainFirstArrivalTime.substring(2,3) != ":"){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }
    // Check for that Numbers are to the left and right of the semi-colon
  else if( isNaN(parseInt(trainFirstArrivalTime.substring(0, 2))) || isNaN(parseInt(trainFirstArrivalTime.substring(3))) ){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }
    // Check if left hand side is from 00 to 23 
  else if( parseInt(trainFirstArrivalTime.substring(0, 2)) < 0 || parseInt(trainFirstArrivalTime.substring(0, 2)) > 23 ){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;
  }
    // Check if right hand side is from 00 to 59
  else if( parseInt(trainFirstArrivalTime.substring(3)) < 0 || parseInt(trainFirstArrivalTime.substring(3)) > 59 ){
    alert("Please use Military Time! \n" + "Example: 01:00 or 13:00");
    return false;   
  }


  // Edit the First Arrival Time to include the date of new data submission (for use in moment.js)
    // Collect the date upon user click
  var today = new Date();
  var thisMonth = today.getMonth() + 1;
  var thisDate = today.getDate();
  var thisYear = today.getFullYear();

    // Create a String from the Date 
  var dateString = "";
  var dateString = dateString.concat(thisMonth, "/", thisDate, "/", thisYear);

    // Create a Date and Time String for Storage
  var trainFirstArrival = dateString.concat(" ", trainFirstArrivalTime);



  // Push New Data to FireBase (generates new keys, adding to the database)
  database.ref().push({
    name: trainName,
    destination: trainDestination,
    firstArrival: trainFirstArrival,
    frequency: trainFreq
  });


  // Clear Input Fields After successful submission
  $("#nameInput").val("");
  $("#destinationInput").val("");
  $("#firstArrivalInput").val("");
  $("#frequencyInput").val("");


  // Prevent Default Refresh of Submit Button
  return false;
 
});


// Refresh the Page Each Minute

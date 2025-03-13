function generateUserReference()
{
  var outputObject = {};
  const sheetName = 'factionMembers';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var dataRange = sheet.getDataRange();
  const [headers,...sheetValues] = dataRange.getValues();
  
  sheetValues.forEach( (row, indexRowPosition) => {

    const rowObject = {
      rowIndex : indexRowPosition + 1

    }
    headers.forEach((key, indexColumnPosition) => {
      rowObject[key] = row[indexColumnPosition]
  })
  outputObject[rowObject.playerID] = rowObject
  })
  return outputObject;
}

function xanaxLogs()
{
  var userIDRegEx = /(?<=XID=).*?(?=")/;
  var usernameRegEx = /(?<=>).*/;
  var timestamp = (Math.floor((Date.now() - 0.25 * 60 * 60 * 1000) / 1000).toString());
  var apiKey = 'TORN_API_KEY';
  const params = 
  {
     method : "GET",
     contentType : "application/json", 
     headers : {
        Authorization : ` ${apiKey}`
     }
  }
  var url = 'https://api.torn.com/v2/faction/news?striptags=false&limit=100&sort=DESC&from=' + timestamp + '&cat=armoryAction';
  var response = UrlFetchApp.fetch(url, params);
  if (response.getResponseCode() == 200) 
    {
    var xanaxLogs = JSON.parse(response.getContentText());
    var xanax = xanaxLogs.news
    for (var id in xanax)
    {
      if (xanax.hasOwnProperty(id))
      {
        var armouryEntry = xanax[id]
        var a = armouryEntry.text;
        if (a.indexOf('Xanax') > -1)
        {
          Logger.log('Xanax found');
          var splitTest = a.split("</a>")         
          var userID = userIDRegEx.exec(a);
          Logger.log(userID);
          var username = usernameRegEx.exec(splitTest[0]);
          var usernameString = username.toString();
          var timeLog = armouryEntry.timestamp;
          var timeDate = new Date(timeLog * 1000);
          tallyXanax(userID);
          const message = 'took a xanax';
          const sheetName = 'xanaxLog';
          const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

          var userProperties = [[usernameString],[message],[timeDate]]
          var dataUnit;
          var data = [];
          for (var i = 0; i < userProperties.length; i++) 
          {
           dataUnit = userProperties[i].toString();
           data.push(dataUnit);;
          }
        sheet.appendRow(data)
        }
      }
    }
  }
}

function tallyXanax (userID)
{
  const sheetName = 'xanaxTracker';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const userMapping = generateUserReference();

  for (var playerID in userMapping) 
  {
    if (userMapping.hasOwnProperty(playerID)) 
    {

      if ( playerID == userID)
      {
        var userRow = userMapping[playerID].row;
        var count = sheet.getRange(userRow, 2).getValues();
        count++;
        sheet.getRange(userRow, 2).setValue(count);
      }

    }
  }
}


function initializeFactionMembers()
{
  var apiKey = 'TORN_API_KEY';
  const params = 
  {
     method : "GET",
     contentType : "application/json", 
     headers : {
        Authorization : `ApiKey ${apiKey}`
     }
  }
  var url = 'https://api.torn.com/v2/faction/members?striptags=true';
  var response = UrlFetchApp.fetch(url, params);
  if (response.getResponseCode() == 200) 
    {
    var memberLog = JSON.parse(response.getContentText());
    var members = memberLog.members
    //var ID = memberLog.id
    for (var id in members)
    {
      if (members.hasOwnProperty(id))
      {
        var logEntry = members[id];
        var username = logEntry.name;
        var userID = logEntry.id;
        addUser(userID, username)
      }
    }
  }
}

function factionUpdate()
{
  var userIDRegEx = /(?<=XID=).*?(?=>)/;
  var usernameRegEx = /(?<=>).*/;
  const sheetName = 'factionMembers';
  var timestamp = (Math.floor((Date.now() - 0.5 * 60 * 60 * 1000) / 1000).toString());

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var apiKey = 'TORN_API_KEY';
  const params = 
  {
     method : "GET",
     contentType : "application/json", 
     headers : {
        Authorization : `ApiKey ${apiKey}`
     }
  }
  var url = 'https://api.torn.com/v2/faction/news?striptags=false&limit=100&sort=DESC&from=' + timestamp + '&cat=membership';
  var response = UrlFetchApp.fetch(url, params);
  if (response.getResponseCode() == 200) 
    {
    var factionLog = JSON.parse(response.getContentText());
    var factionNews = factionLog.news
    for (var id in factionNews)
    {
      if (factionNews.hasOwnProperty(id))
      {
        var newsEntry = factionNews[id]
        var a = newsEntry.text;
        if (a.indexOf('left') > -1)
        {
          var splitTest = a.split("</a>")         
          var userID = userIDRegEx.exec(a);
          var username = usernameRegEx.exec(splitTest[0]);
          var message = "left";
          var officerName = "N/A";
          var usernameString = username.toString();
          removeUser(userID, username);
          factionMovement(usernameString, officerName, message)
        } 
        else if (a.indexOf('accepted') > -1)
        {
          var splitTest = a.split("</a>")
          var userID = userIDRegEx.exec(splitTest[1]);
          var officerName = usernameRegEx.exec(splitTest[0]);
          var username = usernameRegEx.exec(splitTest[1]);
          var usernameString = username.toString();
          var officerNameString = officerName.toString();
          var message = "Accepted";
          addUser(userID, username)
          factionMovement(usernameString, officerNameString, message)
        }
        else if (a.indexOf('kicked') > -1)
        {
          var splitTest = a.split("</a>")
          var userID = userIDRegEx.exec(splitTest[0]);
          var username = usernameRegEx.exec(splitTest[0]);
          var officerName = usernameRegEx.exec(splitTest[1]);
          var usernameString = username.toString();
          var officerNameString = officerName.toString();
          var message = "Kicked";
          removeUser(userID,username);
          factionMovement(usernameString, officerNameString, message)
        }
      }
    }
  }
}
function getCrimes()
{
  const sheetName = 'crimeTracker';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const income = 'Income';
  const incomeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(income);
  var apiKey = 'TORN_API_KEY';
  var timestamp = (Math.floor((Date.now() - 168 * 60 * 60 * 1000) / 1000).toString());

  const params = 
  {
     method : "GET",
     contentType : "application/json", 
     headers : {
        Authorization : `ApiKey ${apiKey}`
     }
  }
  var url = 'https://api.torn.com/v2/faction/crimes?cat=completed&offset=0from=' + timestamp;
  var response = UrlFetchApp.fetch(url, params);
  if (response.getResponseCode() == 200) 
    {
    var crimeLog = JSON.parse(response.getContentText());
    var crimes = crimeLog.crimes
    for (var name in crimes)
    {
      if (crimes.hasOwnProperty(name))
      {
        var crimeEntry = crimes[name];
        var crimeName = crimeEntry.name;
        var crimeID = crimeEntry.id;
        var crimeStatus = crimeEntry.status;
        var crimeSlots = crimeEntry.slots;
        if (crimeStatus == 'Successful')
        {
          var money = crimeEntry.rewards.money;
          var respect = crimeEntry.rewards.respect
        } 
        else if (crimeStatus == 'Failure')
        {
          var money = 0;
          var respect = 0;
          for (var user_id in crimeSlots)
          {
            if (crimeSlots.hasOwnProperty(user_id))
            {
              var userEntry = crimeSlots[user_id]
              var userName = userEntry.user_id;
              var successChance = userEntry.success_chance;
              tallyFailure(crimeName, userName, successChance, crimeID);
            }
          }
        }
        var moneyCount = incomeSheet.getRange(1, 2).getValue();
        var totalMoney = moneyCount + money;
        incomeSheet.getRange(1, 2).setValue(totalMoney)
        var respectCount = incomeSheet.getRange(3, 2).getValue();
        var totalRespect = respect + respectCount;
        incomeSheet.getRange(3, 2).setValue(totalRespect)
        for (var user_id in crimeSlots)
        {
          if (crimeSlots.hasOwnProperty(user_id))
          {
            var userEntry = crimeSlots[user_id]
            var userName = userEntry.user_id;
            var successChance = userEntry.success_chance;
            tallyOC(crimeName, userName);
          }
        }
      }
    }
  }
}

function tallyOC(crimeName, userName)
{
  const sheetName = 'crimeTracker';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);


  const userMapping = generateUserReference();
  if (crimeName == 'Mob Mentality')
  {
    var crimeCollumn = 2;
  }
  else if (crimeName == 'Pet Project')
  {
      var crimeCollumn = 3;
  }
  else if (crimeName == 'Cash Me If You Can')
  {
    var crimeCollumn = 4;
  }
  else if (crimeName == 'Smoke and Wing Mirrors')
  {
    var crimeCollumn = 5;
  }
  else if (crimeName == 'Market Forces')
  {
    var crimeCollumn = 6;
  }
  else if (crimeName == 'Snow Blind')
  {
    var crimeCollumn = 7;
  }
  else if (crimeName == 'Stage Fright')
  {
    var crimeCollumn = 8;
  }
  else if (crimeName == 'Leave No Trace')
  {
    var crimeCollumn = 9;
  }
  else if (crimeName == 'Honey Trap')
  {
    var crimeCollumn = 10;
  }
  else if (crimeName == 'Blast From The Past')
  {
    var crimeCollumn = 11;
  }
  else if (crimeName == 'Break The Bank')
  {
    var crimeCollumn = 12;
  }
  else if (crimeName == 'Gaslight The Way')
  {
    var crimeCollumn = 13;
  }
    else if (crimeName == 'Bidding on Chaos')
  {
    var crimeCollumn = 14;
  }
  for (var playerID in userMapping) 
  {
    if (userMapping.hasOwnProperty(playerID)) 
    {

      if ( playerID == userName)
      {
        var userRow = userMapping[playerID].row;
        var count = sheet.getRange(userRow, crimeCollumn).getValues();
        count++;
        sheet.getRange(userRow, crimeCollumn).setValue(count);
      }

    }
  }
}

function tallyFailure(crimeName, userName, successChance, crimeID)
{
  const sheetName = 'failedOC';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);


  const userMapping = generateUserReference();
  for (var playerID in userMapping) 
  {
    if (userMapping.hasOwnProperty(playerID)) 
    {

      if ( playerID == userName)
      {
        var playerUsername = userMapping[playerID].username;
        Logger.log(playerUsername);
        var userProperties = [[crimeName],[userName],[playerUsername],[successChance],[crimeID]]
        var dataUnit;
        var data = [];
        for (var i = 0; i < userProperties.length; i++) {
        dataUnit = userProperties[i].toString();
        data.push(dataUnit);
      }
      sheet.appendRow(data);


      }

    }
  }
}

function factionMovement(username, officerName, message)
{
  const sheetName = 'factionMovement';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  var userProperties = [[officerName],[message],[username]]
  var dataUnit;
  var data = [];
  for (var i = 0; i < userProperties.length; i++) 
  {
  dataUnit = userProperties[i].toString();
  data.push(dataUnit);;
  }
  sheet.appendRow(data)
}

function addUser(userID, username)
{
  const sheetName = 'factionMembers';

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const lastRow = sheet.getLastRow();
  var rowValue = lastRow + 2;
  var userProperties = [[userID],[username],[rowValue]]
  var dataUnit;
  var data = [];
  for (var i = 0; i < userProperties.length; i++) {
    dataUnit = userProperties[i].toString();
    data.push(dataUnit);
  }
  sheet.appendRow(data);

  var insertRow = rowValue - 1;
  var sheetMembers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('crimeTracker');
  var cell = sheetMembers.getRange(rowValue, 1);
  cell.setFormula('=factionMembers!B' + insertRow);
  var sheetXanax = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('xanaxTracker');
  var cellXanax = sheetXanax.getRange(rowValue, 1);
  cellXanax.setFormula('=factionMembers!B' + insertRow);
}

function removeUser(userID, username)
{
  Logger.log(username);
  const crimeSheetName = 'crimeTracker';
  const crimeSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(crimeSheetName);
  const xanaxSheetName = 'xanaxTracker';
  const sheetXanax = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(xanaxSheetName);
  const sheetName = 'factionMembers';
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  const userMappingUpdate = generateUserReference();
  var count = 0;
  var row = 1
  for (var playerID in userMappingUpdate) 
    {
      count++;
      row++;
      var userRow = userMappingUpdate[playerID].row;
      Logger.log(count)
      var updatedRow =count +2;
      sheet.getRange(row, 3).setValue(updatedRow);
    }
  var userMapping = generateUserReference();
  for (var playerID in userMapping) 
    {
      var rowValue = userMapping[playerID].row;
      var insertRow = rowValue - 1;
      var sheetMembers = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('crimeTracker');
      var cell = sheetMembers.getRange(rowValue, 1);
      cell.setFormula('=factionMembers!B' + insertRow);
      var cellXanax = sheetXanax.getRange(rowValue, 1);
      cellXanax.setFormula('=factionMembers!B' + insertRow);

    }
  var searchRange = sheet.getDataRange();
  var crimeRange = crimeSheet.getDataRange();
  var xanaxRange = sheetXanax.getDataRange();
  var textFinder = searchRange.createTextFinder(userID).findNext();
  var userRow = textFinder.getRow();
  sheet.deleteRow(userRow);
  var textFinder2 = crimeRange.createTextFinder(username).findNext();
  var userCrimeRow = textFinder2.getRow();
  sheet.deleteRow(userCrimeRow);
  var textFinder3 = xanaxRange.createTextFinder(username).findNext();
  var userXanaxRow = textFinder3.getRow();
  sheet.deleteRow(userXanaxRow);
}

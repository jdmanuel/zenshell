#!/usr/bin/env node

var request    = require('request'),
    querystring = require('qs'),
    loremIpsum = require('lorem-ipsum'),
    output     = loremIpsum(),
    fs         = require('fs'),
    program  = require('commander'),

    host = "",
    email = "",
    password = "",
    subject = "",
    description = "",
    priority = "",
    ticketStatus = "",
    createdAt = "",
    ticketType = "",
    assignee = "",

    ticketTypes = ["problem", "incident", "question", "comment"],
    priorities = ["urgent", "high", "normal", "low"],
    statuses = ["new", "open", "pending", "hold", "solved", "closed"];

/* Commander options */

program
  .version('0.1.0')
  .option('-x, --express', 'Express mode')
  .option('-t, --ticket_type [ticket_type]', 'Ticket type')
  .option('-p, --ticket_priority [ticket_priority]', 'Ticket priority')
  .option('-s, --ticket_status [ticket_status]', 'Ticket status')
  .option('-c, --ticket_count [ticket_count]', 'Ticket count')
  .parse(process.argv);

/* Main */

init();

/* Honey bunches of oats */

function init() {
  var fs = require('fs');
  var readline = require('readline');
  var stream = require('stream');
  var instream = fs.createReadStream('zenshell.cfg');
  var outstream = new stream;
  var rl = readline.createInterface(instream, outstream);
  var lineCount = 0;

  rl.on('line', function(line) {
    if (lineCount == 0) {
      host = line.trim();
    }
    if (lineCount == 1) {
      email = line.trim();
    }
    if (lineCount == 2) {
      password = line.trim();
    }
    lineCount++;
  });

  rl.on('close', function() {
    // run for each ticket desired
    if (program.express) {
      setExpressParameters(program.ticket_count);
    } else {
      getUserInput(program.ticket_count);
    }
  });
}

function randomIndex(upperBound) {
  return Math.floor((Math.random() * upperBound));
}

function randomTicketType() {
  return ticketTypes[randomIndex(4)];
}

function randomPriority() {
  return priorities[randomIndex(4)];
}

function randomStatus() {
  return statuses[randomIndex(6)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function validTicketType(ticketType) {
  return ticketTypes.indexOf(ticketType) >= 0;
}

function generateStrings(units, count, minWords, maxWords) {
  return loremIpsum({
    count: count,
    units: units,
    sentenceLowerBound: minWords,
    sentenceUpperBound: maxWords,
    paragraphLowerBound: 3,
    paragraphUpperBound: 7,
    format: 'plain',
    random: Math.random
  });
}

function setExpressParameters(count) {
  if (count == 0) {
    process.exit();
  }

  subject = generateStrings('sentences', 1, 5, 10);
  description = generateStrings('paragraphs', 1, 5, 10);
  ticketType = (program.ticket_type) ? program.ticket_type : randomTicketType();

  priority = (program.ticket_priority) ? program.ticket_priority : randomPriority();
  ticketStatus = (program.ticket_status) ? program.ticket_status : randomStatus();
  var oneYearAgo = (new Date()).getTime() - (3600000 * 24 * 365);
  createdAt = randomDate(new Date(oneYearAgo), new Date());
  assignee = email;

  postTicket(count);
}

function getUserInput(count) {
  if (count == 0) {
    process.exit();
  }

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  getParameter("\nSubject", 'sentences', null, function(result) {
    console.log("Your subject is:", result);
    subject = result;

    getParameter("\nDescription", 'paragraphs', null, function(result) {
      console.log("Your description is:", result);
      description = result;

      getParameter("\nTicket Type", null, randomTicketType(), function(result) {
        ticketType = result;
        console.log("Ticket type is:", result);

        getParameter("\nPriority", null, randomPriority(), function(result) {
          console.log("Your priority is:", result);
          priority  = result;

          getParameter("\nStatus", null, randomStatus(), function(result) {
            console.log("Your status is:", result);
            ticketStatus = result;

            getParameter("\nCreated At", null, new Date(), function(result) {
              console.log("Your createdAt is:", result);
              createdAt = result;

              getParameter("\nAssignee", null, email, function(result) {
                console.log("Your assignee is:", result);
                assignee = result;

                postTicket(count);
              });
            });
          });
        });
      });
    });
  });
}

function getParameter(question, loremIpsumUnits, defaultValue, callback) {
  var stdin = process.stdin, stdout = process.stdout;
  stdout.write(question + ": ");

  stdin.once('data', function(data) {
    data = data.toString().trim();

    if (data) {
        callback(data);
    } else {
       if (loremIpsumUnits) {
         callback(generateStrings(loremIpsumUnits, 1, 5, 10));
       } else {
         callback(defaultValue);
       }
    }
  });
}

function postTicket(count) {
  var postData = {
    'ticket': {
      'subject': subject,
      'description': description,
      'created_at': createdAt,
      'priority': priority,
      'status': ticketStatus,
      'type': ticketType
    }
  };

  request.post({
      url: "https://" + host +".zendesk.com/api/v2/tickets.json",
      auth: {
        'user': email,
        'pass': password,
        'sendImmediately': false
      },
      headers: {'content-type': 'application/x-www-form-urlencoded'},
      body: querystring.stringify(postData)
      },

      function (error, response, body) {
        if (error) {
          console.log("\n" + error);
        } else {
          console.log("\n" + body);
          console.log("\n" + response.statusCode);

          if (program.express) {
            setExpressParameters(--count);
          } else {
            getUserInput(--count);
          }
        }
      }
  );
}

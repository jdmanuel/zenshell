#!/usr/bin/env node

var request     = require('request'),
    querystring = require('qs'),
    loremIpsum  = require('lorem-ipsum'),
    output      = loremIpsum(),
    fs          = require('fs'),
    program     = require('commander'),
    prettyjson  = require('prettyjson'),

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

    assigneeId = null;

    ticketTypes = ["problem", "incident", "question", "comment"],
    priorities = ["urgent", "high", "normal", "low"],
    statuses = ["new", "open", "pending", "hold", "solved", "closed"];

/* Commander options */

program
  .version('0.1.0')
  .option('-q, --quiet', 'Quiet mode (suppress output)')
  .option('-j, --pretty', 'JSON pretty print')
  .option('-x, --express', 'Express mode / Command Line mode')
  .option('-s, --subject [ticket_subject]', 'Ticket subject')
  .option('-d, --description [ticket_description]', 'Ticket description')
  .option('-t, --type [ticket_type]', 'Ticket type')
  .option('-p, --priority [ticket_priority]', 'Ticket priority')
  .option('-z, --status [ticket_status]', 'Ticket status')
  .option('-a, --assignee [ticket_assignee]', 'Ticket assignee')
  .option('-c, --count [count]', 'Ticket count')
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
  var ticketCount = program.count || 1;

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
      setExpressParameters(ticketCount);
    } else {
      getUserInput(ticketCount);
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

  subject = (program.subject) ? program.subject : generateStrings('sentences', 1, 5, 10);
  description = (program.description) ? program.description : generateStrings('paragraphs', 1, 5, 10);
  ticketType = (program.type) ? program.type : randomTicketType();
  priority = (program.priority) ? program.priority : randomPriority();
  ticketStatus = (program.status) ? program.status : randomStatus();
  assignee = (program.assignee) ? program.assignee : email;

  processParameters(count);
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

            getParameter("\nAssignee", null, email, function(result) {
              console.log("Your assignee is:", result);
              assignee = result;

              processParameters(count);
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

function processParameters(count) {
  assigneeId = findUserByEmail(assignee, count);
}

function findUserByEmail(userEmail, count) {
  var searchUrl = 'http://dev.localhost:3000/api/v2/users/search.json?query="' + userEmail + '"';

  request({
    method: 'GET',
    url: searchUrl,
    auth: {
        'user': email,
        'pass': password,
        'sendImmediately': true
    }
  },

  function(error, response, body) {
    if (error) {
      console.log(error);
      console.log("Exiting...");
      process.exit();
    } else {
      // console.log(body);
      var userId = (JSON.parse(body)).users[0].id;
      assigneeId = userId;
      postTicket(count);
    }
  });
}

function postTicket(count) {
  var postData = {
    'ticket': {
      'subject': subject,
      'description': description,
      'priority': priority,
      'status': ticketStatus,
      'type': ticketType,
      'assignee_id': assigneeId
    }
  };

  request.post({
      url: host + "/api/v2/tickets.json",
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
          if (response.statusCode == 201) {
            console.log("\nSUCCESS:", response.statusCode);
          } else {
            console.log(response.statusCode);
          }

          if (!program.quiet) {
            var output = (program.pretty) ? prettyjson.render(JSON.parse(body)) : body;
            console.log("\n" + output + "\n");
          }

          .version('0.1.0')
  .option('-q, --quiet', 'Quiet mode (suppress output)')
  .option('-j, --pretty', 'JSON pretty print')
  .option('-x, --express', 'Express mode / Command Line mode')
  .option('-s, --subject [ticket_subject]', 'Ticket subject')
  .option('-d, --description [ticket_description]', 'Ticket description')
  .option('-t, --type [ticket_type]', 'Ticket type')
  .option('-p, --priority [ticket_priority]', 'Ticket priority')
  .option('-z, --status [ticket_status]', 'Ticket status')
  .option('-a, --assignee [ticket_assignee]', 'Ticket assignee')
  .option('-c, --count [count]', 'Ticket count')

          if (program.express     ||
              program.subject     ||
              program.description ||
              program.type        ||
              program.priority    ||
              program.status      ||
              program.assignee) {
            setExpressParameters(--count);
          } else {
            getUserInput(--count);
          }
        }
      }
  );
}

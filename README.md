# zenshell (alpha) #

## Purpose ##

Some fake stuff

Designed to make Zendesk ticket creation a bit faster and easier -- particularly when multiple tickets are needed.

## Setup ##

Modify the zenshell.cfg file, adding your own domain, and the email address and password for the agent for whom you wish to create tickets.

Type "npm install" and press ENTER (necessary modules will be installed based on dependencies in package.json).

## Use ##

Use the -c or --count flag to indicate the number of tickets you want to create:
./zenshell.js -c 3

Currently, there are two modes -- regular and express, or command-line.

In regular mode, you will be stepped through ticket creation.  You'll have a chance to specify each parameter currently supported.
If you don't care about the value of a particular param, just press ENTER, and a default or random value will be assigned.

To enable express, pass the -x or --express flag, e.g.:
./zenshell.js -x

In express/command line mode, you can enter any number of allowed params via the command line and tickets will be initialized with those fields.
If you don't specify any, it will be as though you pressed ENTER for every field while creating tickets in normal mode.

For example:  ./zenshell.js -x -s "The quick brown fox" -t "problem" -a jp@zendesk.com -t "problem" -c 3
This will create three tickets.  For each ticket, it will set the subject to "The quick brown fox", the assignee to "jp@zendesk.com", and the type to "problem."  All other fields will be randomized.

Suppose you want to create 5 urgent priority tickets.  To do so:
./zenshell.js -x -p 'urgent' -c 5

If you want to specify fields in this way, you can omit the "-x" option (it is only required if you do not specify any fields, and want them all set to random or default values).

Supported fields:

* -s  --subject
* -d  --description
* -t  --type ["problem", "incident", "question", "comment"]
* -p  --priority ["urgent", "high", "normal", "low"]
* -st --status ["new", "open", "pending", "hold", "solved", "closed"]
* -a  --assignee [email address]

## Author ##

J.D. Manuel

jdmanuel@icloud.com

License: MIT


# zenshell (alpha) #

## Purpose ##

Designed to make Zendesk ticket creation a bit faster and easier -- particularly when multiple tickets are needed.

## Setup ##

Modify the zenshell.cfg file, adding your own domain, and the email address and password for the agent for whom you wish to create tickets.

## Use ##

Use the -c or --count flag to indicate the number of tickets you want to create:
./zenshell.js -c 3

Currently, there are two modes -- regular and express.

In regular mode, you will be stepped through ticket creation.  You'll have a chance to specify each parameter currently supported.
If you don't care about the value of a particular param, just press ENTER, and a default or random value will be assigned.

To enable express, pass the -x or --express flag, e.g.:
./zenshell.js -x

In express mode, all ticket values are default or random.  In other words, it is just as if you pressed ENTER when prompted for each parameter.  This is a good way to create tickets quickly.

You can enable express mode, while also specifying the value (for all tickets) for a particular field.  For example, say you want to create 5 urgent priority tickets.  To do so:
./zenshell.js -x -p 'urgent' -c 5

This works for a few fields:
-t --ticket_type ["problem", "incident", "question", "comment"]
-p --ticket_priority ["urgent", "high", "normal", "low"]
-s --ticket_status ["new", "open", "pending", "hold", "solved", "closed"]

## Author ##

J.D. Manuel
jdmanuel@icloud.com
License: MIT


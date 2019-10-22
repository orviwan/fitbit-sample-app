
import Ably from 'ably/browser/static/ably-commonjs.js'

var realtime = new Ably.Realtime("xxx"); 

/* Subscribe to messages on the sport channel */
var channel = realtime.channels.get("sport");
channel.subscribe(function(msg) {
  console.log("Received: ");
  myLabel.text = JSON.stringify(msg.data);
});

console.log("Hello world!");

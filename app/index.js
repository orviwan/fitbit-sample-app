import document from "document";
// import * as Ably from 'ably';
 
const myLabel = document.getElementById("myLabel");

// var realtime = new Ably.Realtime('JAofug.wynVXg:YU-Tf_OcO7Jz_UIK'); /* ADD YOUR API KEY HERE */
    /* Subscribe to messages on the sport channel */
    // var channel = realtime.channels.get("sport");
    // channel.subscribe(function(msg) {
    //   console.log("Received: ");
    //   myLabel.text = JSON.stringify(msg.data);
    // });
    // /* Publish a message when the button is pressed */
    let mybutton = document.getElementById("mybutton");
mybutton.onactivate = function(evt) {
  console.log("CLICKED!");
  // channel.publish("update", { "team": "Man United" });
}

console.log('Hello world!');

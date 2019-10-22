import document from "document";
 
const myLabel = document.getElementById("myLabel");

// /* Publish a message when the button is pressed */
let mybutton = document.getElementById("mybutton");

mybutton.onactivate = function(evt) {
  console.log("CLICKED!");
}

console.log('Hello world!');

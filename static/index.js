import {lobby} from "./lobby"

kaboom({
    width: 320,
    height: 240,
    background: [58, 55, 65],
    canvas: document.querySelector("#game"),
    crisp: true,
    font: "vom",
});

// loadFont("pixeboy", "fonts/pixeboy.ttf")
loadFont("vom", "fonts/vcr_osd_mono.ttf")

let protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
let socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

lobby({socket});

go("lobby")

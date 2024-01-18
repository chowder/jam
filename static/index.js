import {lobby} from "./lobby"

kaboom({
    width: 320,
    height: 360,
    background: [58, 55, 65],
    canvas: document.querySelector("#game"),
    crisp: true,
    font: "vom",
});

loadFont("vom", "fonts/vcr_osd_mono.ttf")

loadSpriteAtlas("sprites/bread.png", {
    "bread": {
        x: 0,
        y: 0,
        width: 32 * 4,
        height: 24,
        sliceX: 4,
        sliceY: 1,
        anims: {
            idle: {from: 0, to: 1, speed: 2, loop: true},
            falling: 2,
            dead: 3,
        }
    }
})

loadSprite("left-icon", "sprites/left.png")
loadSprite("right-icon", "sprites/right.png")
loadSprite("background", "sprites/background.png")

let protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
let socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

lobby({socket});

go("lobby")

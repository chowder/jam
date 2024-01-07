// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package pkg

import "encoding/json"

// Hub maintains the set of active clients and broadcasts messages to the
// clients.
type Hub struct {
	// Registered clients by Name
	clients map[*Client]*Player

	// Inbound messages from the clients.
	broadcast chan []byte

	// Register requests from the clients.
	register chan *Client

	// Unregister requests from clients.
	unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]*Player),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			player := h.createPlayerForClient(client)
			h.clients[client] = player
			h.notifyPlayerJoin(player)
			h.sendPlayerList(client)
		case client := <-h.unregister:
			if player, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				h.notifyPlayerLeave(player)
			}
		case message := <-h.broadcast:
			for client, player := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
					h.notifyPlayerLeave(player)
				}
			}
		}
	}
}

func (h *Hub) createPlayerForClient(client *Client) *Player {
	player := makePlayer()
	message, _ := json.Marshal(Packet{
		PacketType: "SET_PLAYER",
		Data:       player,
	})
	client.send <- message
	return player
}

func (h *Hub) notifyPlayerJoin(player *Player) {
	message, _ := json.Marshal(Packet{
		PacketType: "PLAYER_JOIN",
		Data:       player,
	})

	for client, p := range h.clients {
		if p != player {
			client.send <- message
		}
	}
}

func (h *Hub) notifyPlayerLeave(player *Player) {
	message, _ := json.Marshal(Packet{
		PacketType: "PLAYER_LEAVE",
		Data:       player.Name,
	})

	for client, p := range h.clients {
		if p != player {
			client.send <- message
		}
	}
}

func (h *Hub) sendPlayerList(client *Client) {
	for c, p := range h.clients {
		if c != client {
			message, _ := json.Marshal(Packet{
				PacketType: "PLAYER_JOIN",
				Data:       p,
			})
			client.send <- message
		}
	}
}

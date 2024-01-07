package main

type Packet struct {
	PacketType string      `json:"type"`
	Data       interface{} `json:"data"`
}

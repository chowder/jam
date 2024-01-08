// Copyright 2013 The Gorilla WebSocket Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"embed"
	"flag"
	"github.com/chowder/jam/pkg"
	"io/fs"
	"log"
	"net/http"
	"time"
)

var (
	//go:embed static/dist
	static embed.FS
)

var addr = flag.String("addr", ":8080", "http service address")

func serveHome(w http.ResponseWriter, r *http.Request) {
	log.Println(r.URL)
	if r.URL.Path != "/" {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	http.ServeFile(w, r, "home.html")
}

func main() {
	flag.Parse()
	hub := pkg.NewHub()
	go hub.Run()

	staticRoot, err := fs.Sub(static, "static/dist")
	if err != nil {
		log.Fatal(err)
	}

	http.Handle("/", http.FileServer(http.FS(staticRoot)))
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		log.Print("Incoming connection from ", r.RemoteAddr)
		pkg.ServeWs(hub, w, r)
	})

	server := &http.Server{
		Addr:              *addr,
		ReadHeaderTimeout: 3 * time.Second,
	}

	log.Println("Serving on", server.Addr)
	err = server.ListenAndServe()
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}
